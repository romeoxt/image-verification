import Link from "next/link";
import { ShieldCheck, Camera, Lock, FileCheck, ArrowRight, Check, Play, Menu } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      <link href="https://cdn.prod.website-files.com/68ed090d0998c3c224a59e7c/css/fount-system-c9d99c12020c240d71e663bb1f.webflow.shared.745a53245.min.css" rel="stylesheet" type="text/css" />
      
      <div className="page-wrapper">
        <nav className="navigation">
          <div className="nav_layout">
            <Link href="/" aria-current="page" className="nav_logo w-inline-block w--current">
              <div className="logo" style={{ color: "#FF5F02" }}>
                <ShieldCheck className="h-8 w-8 text-current" />
              </div>
              <div className="logo_word" style={{ color: "rgb(248, 250, 240)", fontSize: '24px', fontWeight: 'bold', marginLeft: '10px' }}>
                PoPC
              </div>
            </Link>
            
            <div className="nav_menu">
              <ul role="list" className="nav_list w-list-unstyled">
                <li className="nav_list-item">
                  <a href="#how-it-works" className="nav_link eyebrow" style={{ color: "rgb(248, 250, 240)" }}>
                    How It Works
                  </a>
                </li>
                <li className="nav_list-item">
                  <a href="#use-cases" className="nav_link eyebrow" style={{ color: "rgb(248, 250, 240)" }}>
                    Use Cases
                  </a>
                </li>
                <li className="nav_list-item">
                  <a href="#developers" className="nav_link eyebrow" style={{ color: "rgb(248, 250, 240)" }}>
                    Developers
                  </a>
                </li>
                <li className="nav_list-item">
                  <a href="#about" className="nav_link eyebrow" style={{ color: "rgb(248, 250, 240)" }}>
                    About
                  </a>
                </li>
              </ul>
              
              <div className="nav_list-secondary">
                <Link href="/dashboard" className="nav_link eyebrow cc-secondary" style={{ color: "rgb(248, 250, 240)" }}>
                  Login
                </Link>
                <Link aria-label="" href="/dashboard" className="btn cc-navigation w-inline-block" style={{ borderColor: "rgb(248, 250, 240)" }}>
                  <div>Get Started</div>
                </Link>
              </div>
            </div>
            
            <div className="menu_button">
              <Menu className="text-white" />
            </div>
          </div>
          <div className="nav_bg" style={{ opacity: 0, visibility: "hidden" }}></div>
        </nav>

        <main className="page-main">
          <section className="hero section u-theme-dark u-overflow-hidden">
            <div className="w-layout-blockcontainer container u-z-index-2 w-container">
              <div className="row row-bottom row-between u-vgap-24" style={{ transform: "translate(0%, -10%)" }}>
                <div className="col col-lg-8 col-sm-12">
                  <div className="u-vflex-left-top u-vgap-24">
                    <h1 className="hero_h1">
                      Trust what you see.<br />Verify what is <span style={{color: "#4ade80"}}>real</span>.
                    </h1>
                    <p className="p-xl u-color-secondary">
                      PoPC cryptographically verifies that photos and videos were captured by a real device, at a real place and time.
                    </p>
                  </div>
                </div>
                <div className="col col-shrink col-sm-12">
                  <Link href="/dashboard" className="btn-primary w-inline-block">
                    <div aria-label="" className="btn cc-primary">
                      <div>Start Verifying</div>
                    </div>
                    <div className="btn-arrow">
                      <div className="btn-arrow-icon u-p-absolute">
                        <ArrowRight className="u-icon cc-24" />
                      </div>
                      <div className="btn-arrow-icon">
                        <ArrowRight className="u-icon cc-24" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            <div className="hero_bg-scrim" style={{ transform: "translate(0%, 10%)" }}></div>
            {/* Abstract background lines simulation */}
            <div className="hero_bg-lines-container" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
                <svg width="100%" height="100%" viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0 H1440 V800 H0 Z" fill="none" />
                    {/* Placeholder for complex SVG lines */}
                </svg>
            </div>
          </section>

          <div className="u-pv-48-24 u-theme-dark u-bg-secondary">
            <div className="w-layout-blockcontainer container w-container">
              <div className="u-vflex-stretch-top u-vgap-24-16">
                <div className="row row-center-horizontal">
                  <div className="col col-shrink">
                    <h2 className="eyebrow u-align-center">
                      Built for integrity-critical industries
                    </h2>
                  </div>
                </div>
                <div className="row row-center-horizontal row-no-gutters" style={{ gap: '2rem', opacity: 0.7 }}>
                   {/* Text Placeholders for Logos to avoid broken images */}
                   <div className="col"><h3 className="h6 u-color-secondary">INSURANCE</h3></div>
                   <div className="col"><h3 className="h6 u-color-secondary">JOURNALISM</h3></div>
                   <div className="col"><h3 className="h6 u-color-secondary">LEGAL</h3></div>
                   <div className="col"><h3 className="h6 u-color-secondary">PLATFORMS</h3></div>
                   <div className="col"><h3 className="h6 u-color-secondary">ARCHIVE</h3></div>
                </div>
              </div>
            </div>
          </div>

          <section className="track section u-pb-0">
            <div className="u-vflex-stretch-top u-vgap-64-24">
              <div className="w-layout-blockcontainer container w-container">
                <div className="row row-center-horizontal">
                  <div className="col col-lg-8">
                    <h2 className="u-align-center">
                      The internet lost its ability to trust images
                    </h2>
                  </div>
                </div>
              </div>
              <div className="tracks_container">
                <div className="tracks_middle">
                  <h3 className="h6">AI is indistinguishable from reality</h3>
                  <h3 className="h6">Metadata is worthless and easily spoofed</h3>
                  <h3 className="h6">Tribal knowledge is stuck in your teams' heads</h3>
                  <h3 className="h6">Trust is broken for courts and insurers</h3>
                </div>
                {/* Simplified visual representation of the track */}
                <div style={{ height: '400px', width: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '2px', height: '100%', background: '#B5B9A6', opacity: 0.3 }}></div>
                    {/* Placeholder for the complex track SVG */}
                </div>
              </div>
            </div>
          </section>

          <section data-tabs="wrapper" className="home_product section u-theme-dark">
            <div className="w-layout-blockcontainer tab_container container w-container">
              <div className="row u-h-100">
                <div className="col col-lg-6 col-md-5 col-sm-12 u-z-index-1">
                  <div className="u-vflex-stretch-between u-vgap-32 u-h-100">
                    <div className="u-vflex-left-top u-vgap-24-16">
                      <h2 className="eyebrow u-color-secondary">
                        PRODUCT
                      </h2>
                      <p className="h2">
                        A complete chain of custody from sensor to cloud
                      </p>
                    </div>
                    <div role="tablist" className="u-vflex-stretch-bottom">
                      <div className="tab-content__item w-inline-block active" style={{ marginBottom: '1rem', cursor: 'pointer' }}>
                        <div className="tab-content__item-main">
                          <h2 className="h6">1. Capture</h2>
                        </div>
                        <div className="tab-content__item-detail" style={{ height: "auto" }}>
                          <p className="u-color-secondary u-pt-0-5">
                            Secure camera app captures media directly from hardware sensors.
                          </p>
                        </div>
                      </div>
                      <div className="tab-content__item w-inline-block" style={{ marginBottom: '1rem', cursor: 'pointer', opacity: 0.6 }}>
                        <div className="tab-content__item-main">
                          <h2 className="h6">2. Sign</h2>
                        </div>
                        <div className="tab-content__item-detail">
                          <p className="u-color-secondary u-pt-0-5">
                            Hardware-backed key signs the data immediately on-device.
                          </p>
                        </div>
                      </div>
                      <div className="tab-content__item w-inline-block" style={{ marginBottom: '1rem', cursor: 'pointer', opacity: 0.6 }}>
                        <div className="tab-content__item-main">
                          <h2 className="h6">3. Verify</h2>
                        </div>
                        <div className="tab-content__item-detail">
                          <p className="u-color-secondary u-pt-0-5">
                            Backend validates the cryptographic signature and origin.
                          </p>
                        </div>
                      </div>
                      <div className="tab-content__item w-inline-block" style={{ marginBottom: '1rem', cursor: 'pointer', opacity: 0.6 }}>
                        <div className="tab-content__item-main">
                          <h2 className="h6">4. Prove</h2>
                        </div>
                        <div className="tab-content__item-detail">
                          <p className="u-color-secondary u-pt-0-5">
                            Generate an immutable evidence package for audit.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col col-lg-6 col-md-7 col-sm-12">
                  <div className="tab-visual__wrap">
                    <div className="tab-visual__item active" style={{ opacity: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', borderRadius: '12px' }}>
                        <Camera className="h-32 w-32 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section u-p-0">
            <div className="case_stat-grid cc-big u-theme-dark">
              <div className="case_stat-cell cc-big">
                <h3 className="h2">100%</h3>
                <h4 className="h6 u-color-secondary">Tamper Proof</h4>
              </div>
              <div className="case_stat-cell cc-big">
                <h3 className="h2">StrongBox</h3>
                <h4 className="h6 u-color-secondary">Hardware Backed</h4>
              </div>
              <div className="case_stat-cell cc-big">
                <h3 className="h2">C2PA</h3>
                <h4 className="h6 u-color-secondary">Standard Compliant</h4>
              </div>
              <div className="case_stat-cell cc-big">
                <h3 className="h2">Instant</h3>
                <h4 className="h6 u-color-secondary">Verification</h4>
              </div>
              <div className="case_stat-cell cc-big">
                <h3 className="h2">Zero</h3>
                <h4 className="h6 u-color-secondary">False Positives</h4>
              </div>
            </div>
          </section>

          <section className="section u-pb-0">
            <div className="w-layout-blockcontainer container w-container">
              <div className="u-vflex-stretch-top u-vgap-64-32">
                <div className="row">
                  <div className="col col-lg-8 col-md-12">
                    <div className="u-vflex-left-top u-vgap-24-16">
                      <h2 className="eyebrow u-color-secondary">USE CASES</h2>
                      <p className="h2">
                        Unlocking trust to help you verify and move with confidence
                      </p>
                    </div>
                  </div>
                </div>
                <div className="vertical_tabs w-tabs">
                  <div className="vertical_tabs-menu w-tab-menu" role="tablist">
                    <div className="vertical_tabs-link w-inline-block w-tab-link w--current" style={{ borderBottom: '1px solid #333', padding: '2rem 0' }}>
                      <div className="u-hflex-between-center">
                        <h3 className="h6">For Journalism</h3>
                        <div className="eyebrow u-color-secondary">01</div>
                      </div>
                      <div className="vertical_tabs-inner">
                        <p className="u-color-secondary">
                          Prove photos from conflict zones are real. Defend credibility against fake news accusations with cryptographic proof.
                        </p>
                      </div>
                    </div>
                    <div className="vertical_tabs-link w-inline-block w-tab-link" style={{ borderBottom: '1px solid #333', padding: '2rem 0' }}>
                      <div className="u-hflex-between-center">
                        <h3 className="h6">For Insurance</h3>
                        <div className="eyebrow u-color-secondary">02</div>
                      </div>
                      <div className="vertical_tabs-inner">
                        <p className="u-color-secondary">
                          Eliminate AI-generated claims. Reduce fraud by verifying accident scene photos instantly and securely.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
             <div className="w-layout-blockcontainer container w-container">
                <div className="row row-center-horizontal">
                    <div className="col col-lg-8" style={{textAlign: 'center'}}>
                        <h2 className="hero_h1" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                            Restore Trust in Digital Media
                        </h2>
                        <Link href="/dashboard" className="btn-primary w-inline-block" style={{ margin: '0 auto' }}>
                            <div aria-label="" className="btn cc-primary">
                            <div>Get Started Now</div>
                            </div>
                        </Link>
                    </div>
                </div>
             </div>
          </section>

          <footer className="u-pv-80-48 u-theme-dark u-bg-secondary">
             <div className="w-layout-blockcontainer container w-container">
                <div className="u-hflex-between-center">
                    <p className="u-color-secondary">© 2026 PoPC. All rights reserved.</p>
                    <div className="u-hflex-left-center u-hgap-24">
                        <a href="#" className="u-color-secondary">Privacy</a>
                        <a href="#" className="u-color-secondary">Terms</a>
                    </div>
                </div>
             </div>
          </footer>
        </main>
      </div>
    </>
  );
}
