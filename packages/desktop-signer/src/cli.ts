#!/usr/bin/env node
/**
 * PoPC Desktop Signer CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { basename } from 'path';
import {
  loadConfig,
  saveConfig,
  savePrivateKey,
  savePublicKey,
  loadPrivateKey,
  loadPublicKey,
  isEnrolled,
  getConfigDir,
  checkKeyPermissions,
} from './config';
import {
  generateKeyPair,
  computeHash,
  computeFileHash,
  signData,
  createPublicKeyRequest,
} from './crypto';
import { createManifest, serializeManifest } from './c2pa';
import { PopcApiClient } from './api';

const program = new Command();

program
  .name('popc')
  .description('PoPC Desktop Signer - Sign and verify images with C2PA manifests')
  .version('0.1.0');

/**
 * Enroll command
 */
program
  .command('enroll')
  .description('Enroll this device with the PoPC service')
  .option('-u, --url <url>', 'PoPC API base URL', process.env.POPC_BASE_URL || 'https://image-verification-production.up.railway.app')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔐 PoPC Device Enrollment\n'));

      // Check if already enrolled
      if (await isEnrolled()) {
        console.log(chalk.yellow('⚠️  Device already enrolled!'));
        const config = await loadConfig();
        console.log(chalk.gray(`   Device ID: ${config?.deviceId}`));
        console.log(chalk.gray(`   Enrolled at: ${config?.enrolledAt}\n`));
        console.log(chalk.yellow('   Run with --force to re-enroll (this will generate new keys)'));
        return;
      }

      console.log(chalk.gray('Generating EC P-256 keypair...'));
      const keyPair = generateKeyPair();

      console.log(chalk.gray('Saving keys to ~/.popc/...'));
      await savePrivateKey(keyPair.privateKeyPem);
      await savePublicKey(keyPair.publicKeyPem);

      console.log(chalk.gray('Enrolling with PoPC service...'));
      const client = new PopcApiClient(options.url);
      const publicKeyRequest = createPublicKeyRequest(
        keyPair.publicKeyPem,
        keyPair.publicKeyFingerprint
      );

      const enrollment = await client.enroll(publicKeyRequest, 'web');

      console.log(chalk.gray('Saving configuration...'));
      await saveConfig({
        deviceId: enrollment.deviceId,
        publicKeyFingerprint: enrollment.publicKeyFingerprint,
        securityLevel: enrollment.securityLevel,
        enrolledAt: enrollment.enrolledAt,
        baseUrl: client.getBaseUrl(),
        platform: 'web',
      });

      console.log(chalk.green('\n✅ Enrollment successful!\n'));
      console.log(chalk.gray(`   Device ID: ${enrollment.deviceId}`));
      console.log(chalk.gray(`   Security Level: ${enrollment.securityLevel}`));
      console.log(chalk.gray(`   Public Key Fingerprint: ${enrollment.publicKeyFingerprint}`));
      console.log(chalk.gray(`   Config: ${getConfigDir()}\n`));

      // Check key permissions
      const permsOk = await checkKeyPermissions();
      if (!permsOk) {
        console.log(chalk.yellow('⚠️  Warning: Private key file permissions should be 0600'));
      }

      console.log(chalk.blue('Next steps:'));
      console.log(chalk.gray('   1. Sign an image: ') + chalk.white('popc sign ./photo.jpg'));
      console.log(chalk.gray('   2. Verify it:     ') + chalk.white('popc verify ./photo.jpg'));
    } catch (error) {
      console.error(chalk.red('\n❌ Enrollment failed:'), (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Sign command
 */
program
  .command('sign <imagePath>')
  .description('Sign an image and create C2PA sidecar manifest')
  .option('-o, --output <path>', 'Output sidecar path (default: <imagePath>.c2pa)')
  .action(async (imagePath: string, options) => {
    try {
      console.log(chalk.blue('✍️  PoPC Image Signing\n'));

      // Check if enrolled
      if (!(await isEnrolled())) {
        console.log(chalk.red('❌ Device not enrolled. Run ') + chalk.white('popc enroll') + chalk.red(' first.'));
        process.exit(1);
      }

      const config = await loadConfig();
      const privateKey = await loadPrivateKey();
      const publicKey = await loadPublicKey();

      if (!config || !privateKey || !publicKey) {
        console.log(chalk.red('❌ Missing configuration or keys. Please re-enroll.'));
        process.exit(1);
      }

      console.log(chalk.gray(`Reading image: ${imagePath}`));
      const imageBuffer = await fs.readFile(imagePath);

      console.log(chalk.gray('Computing SHA-256 hash...'));
      const assetHash = computeFileHash(imageBuffer);
      console.log(chalk.gray(`   Hash: ${assetHash}`));

      console.log(chalk.gray('Creating assertions for signature...'));
      // Create assertions object that will be signed
      const assertions = {
        'c2pa.hash.data': {
          algorithm: 'sha256',
          hash: assetHash,
        },
        'popc.device.id': config.deviceId,
        'c2pa.timestamp': new Date().toISOString(),
        platform: config.platform,
        securityLevel: config.securityLevel,
      };

      console.log(chalk.gray('Signing assertions...'));
      // Sign the JSON serialization of assertions (matching C2PA verifier)
      const assertionsJson = JSON.stringify(assertions);
      const signature = signData(assertionsJson, privateKey);

      console.log(chalk.gray('Creating C2PA manifest...'));
      const manifest = createManifest({
        assetHash,
        deviceId: config.deviceId,
        publicKeyPem: publicKey,
        signature,
        assertions, // Pass the same assertions object that was signed
      });

      const sidecarPath = options.output || `${imagePath}.c2pa`;
      console.log(chalk.gray(`Writing sidecar: ${sidecarPath}`));
      await fs.writeFile(sidecarPath, serializeManifest(manifest));

      console.log(chalk.green('\n✅ Image signed successfully!\n'));
      console.log(chalk.gray(`   Image: ${basename(imagePath)}`));
      console.log(chalk.gray(`   Sidecar: ${basename(sidecarPath)}`));
      console.log(chalk.gray(`   Asset Hash: ${assetHash}`));
      console.log(chalk.gray(`   Device ID: ${config.deviceId}\n`));

      console.log(chalk.blue('Next step:'));
      console.log(chalk.gray('   Verify: ') + chalk.white(`popc verify ${imagePath}`));
    } catch (error) {
      console.error(chalk.red('\n❌ Signing failed:'), (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Verify command
 */
program
  .command('verify <imagePath>')
  .description('Verify an image with its C2PA manifest')
  .option('-m, --manifest <path>', 'Path to manifest sidecar (default: <imagePath>.c2pa)')
  .option('-e, --evidence', 'Save evidence package to file')
  .option('-u, --url <url>', 'PoPC API base URL')
  .action(async (imagePath: string, options) => {
    try {
      console.log(chalk.blue('🔍 PoPC Image Verification\n'));

      const config = await loadConfig();
      const baseUrl = options.url || config?.baseUrl || process.env.POPC_BASE_URL;
      const client = new PopcApiClient(baseUrl);

      const manifestPath = options.manifest || `${imagePath}.c2pa`;

      console.log(chalk.gray(`Image: ${imagePath}`));
      console.log(chalk.gray(`Manifest: ${manifestPath}`));
      console.log(chalk.gray('Verifying with PoPC service...\n'));

      // Check if manifest exists
      let hasManifest = false;
      try {
        await fs.access(manifestPath);
        hasManifest = true;
      } catch {
        console.log(chalk.yellow('⚠️  No manifest found - running heuristic verification\n'));
      }

      const result = await client.verify(imagePath, hasManifest ? manifestPath : undefined);

      // Display result
      const modeColor = result.mode === 'certified' ? chalk.blue : chalk.cyan;
      console.log(modeColor(`Mode: ${result.mode.toUpperCase()}`));

      let verdictColor;
      let verdictIcon;
      switch (result.verdict) {
        case 'verified':
          verdictColor = chalk.green;
          verdictIcon = '✅';
          break;
        case 'tampered':
          verdictColor = chalk.red;
          verdictIcon = '❌';
          break;
        case 'unsigned':
          verdictColor = chalk.yellow;
          verdictIcon = '⚠️ ';
          break;
        case 'invalid':
          verdictColor = chalk.red;
          verdictIcon = '⛔';
          break;
        case 'revoked':
          verdictColor = chalk.red;
          verdictIcon = '🚫';
          break;
      }

      console.log(verdictColor(`${verdictIcon} Verdict: ${result.verdict.toUpperCase()}\n`));

      if (result.confidence_score !== undefined) {
        const scoreColor = result.confidence_score >= 70 ? chalk.green : result.confidence_score >= 50 ? chalk.yellow : chalk.red;
        console.log(scoreColor(`Confidence: ${result.confidence_score}/100\n`));
      }

      console.log(chalk.gray('Reasons:'));
      result.reasons.forEach((reason) => {
        console.log(chalk.gray(`  • ${reason}`));
      });

      if (result.metadata) {
        console.log(chalk.gray('\nMetadata:'));
        console.log(chalk.gray(`  Device ID: ${result.metadata.deviceId || 'N/A'}`));
        console.log(chalk.gray(`  Captured: ${result.metadata.capturedAt || 'N/A'}`));
      }

      console.log(chalk.gray(`\nVerification ID: ${result.verificationId}`));
      console.log(chalk.gray(`Asset Hash: ${result.assetSha256}`));

      // Save evidence if requested
      if (options.evidence) {
        console.log(chalk.gray('\nFetching evidence package...'));
        const evidence = await client.getEvidence(result.verificationId);
        const evidencePath = `./evidence-${result.verificationId}.json`;
        await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2));
        console.log(chalk.green(`✅ Evidence saved: ${evidencePath}`));
      } else {
        console.log(chalk.gray('\nTo save evidence package: ') + chalk.white(`popc verify ${imagePath} --evidence`));
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Verification failed:'), (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Show enrollment status and configuration')
  .action(async () => {
    try {
      const enrolled = await isEnrolled();

      if (!enrolled) {
        console.log(chalk.yellow('⚠️  Device not enrolled'));
        console.log(chalk.gray('\nRun ') + chalk.white('popc enroll') + chalk.gray(' to get started'));
        return;
      }

      const config = await loadConfig();
      const permsOk = await checkKeyPermissions();

      console.log(chalk.blue('📊 PoPC Status\n'));
      console.log(chalk.green('✅ Enrolled'));
      console.log(chalk.gray(`   Device ID: ${config?.deviceId}`));
      console.log(chalk.gray(`   Security Level: ${config?.securityLevel}`));
      console.log(chalk.gray(`   Platform: ${config?.platform}`));
      console.log(chalk.gray(`   Fingerprint: ${config?.publicKeyFingerprint}`));
      console.log(chalk.gray(`   Enrolled: ${config?.enrolledAt}`));
      console.log(chalk.gray(`   Base URL: ${config?.baseUrl}`));
      console.log(chalk.gray(`   Config Dir: ${getConfigDir()}`));

      if (!permsOk) {
        console.log(chalk.yellow('\n⚠️  Warning: Private key file permissions are not 0600'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);
