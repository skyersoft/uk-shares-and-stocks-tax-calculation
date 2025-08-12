"""Landing page template with advertisement integration."""

def get_landing_page_html() -> str:
    """Generate the main landing page HTML with ads."""
    
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IBKR Tax Calculator - UK Capital Gains & Portfolio Analysis</title>
    <meta name="description" content="Free UK tax calculator for Interactive Brokers transactions. Calculate capital gains tax, dividend income, and portfolio performance for HMRC compliance.">
    <meta name="keywords" content="UK tax calculator, capital gains tax, Interactive Brokers, IBKR, dividend tax, portfolio analysis, HMRC">
    
    <!-- Google AdSense - Replace YOUR_ADSENSE_ID with your actual AdSense ID -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_ID"
            crossorigin="anonymous"></script>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <style>
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 80px 0;
        }
        .feature-card {
            transition: transform 0.3s;
            height: 100%;
        }
        .feature-card:hover {
            transform: translateY(-5px);
        }
        .ad-container {
            margin: 20px 0;
            text-align: center;
        }
        .upload-area {
            border: 2px dashed #007bff;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            background-color: #f8f9fa;
            transition: all 0.3s;
        }
        .upload-area:hover {
            border-color: #0056b3;
            background-color: #e9ecef;
        }
        .upload-area.dragover {
            border-color: #28a745;
            background-color: #d4edda;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">IBKR Tax Calculator</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/about">About</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/privacy">Privacy</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/terms">Terms</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <h1 class="display-4 fw-bold mb-4">UK Tax Calculator for Interactive Brokers</h1>
                    <p class="lead mb-4">Calculate your UK capital gains tax, dividend income, and portfolio performance from IBKR transactions. HMRC compliant calculations with detailed reporting.</p>
                    <div class="d-flex gap-3">
                        <a href="#calculator" class="btn btn-light btn-lg">Start Calculation</a>
                        <a href="/about" class="btn btn-outline-light btn-lg">Learn More</a>
                    </div>
                </div>
                <div class="col-lg-6">
                    <!-- Top Banner Ad -->
                    <div class="ad-container">
                        <!-- AdSense Banner Ad -->
                        <ins class="adsbygoogle"
                             style="display:block"
                             data-ad-client="ca-pub-YOUR_ADSENSE_ID"
                             data-ad-slot="YOUR_BANNER_SLOT_ID"
                             data-ad-format="auto"
                             data-full-width-responsive="true"></ins>
                        <script>
                             (adsbygoogle = window.adsbygoogle || []).push({});
                        </script>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-5">
        <div class="container">
            <div class="row text-center mb-5">
                <div class="col-lg-8 mx-auto">
                    <h2 class="display-5 fw-bold">Why Choose Our Tax Calculator?</h2>
                    <p class="lead text-muted">Comprehensive UK tax calculations designed specifically for Interactive Brokers users</p>
                </div>
            </div>
            
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="card feature-card h-100 shadow-sm">
                        <div class="card-body text-center">
                            <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px;">
                                <i class="fas fa-calculator fa-lg"></i>
                            </div>
                            <h5 class="card-title">HMRC Compliant</h5>
                            <p class="card-text">Accurate UK tax calculations following HMRC guidelines for capital gains, dividends, and currency gains.</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card feature-card h-100 shadow-sm">
                        <div class="card-body text-center">
                            <div class="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px;">
                                <i class="fas fa-chart-line fa-lg"></i>
                            </div>
                            <h5 class="card-title">Portfolio Analytics</h5>
                            <p class="card-text">Comprehensive portfolio analysis with performance metrics, market breakdown, and current holdings.</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card feature-card h-100 shadow-sm">
                        <div class="card-body text-center">
                            <div class="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 60px; height: 60px;">
                                <i class="fas fa-file-alt fa-lg"></i>
                            </div>
                            <h5 class="card-title">Detailed Reports</h5>
                            <p class="card-text">Generate comprehensive reports in multiple formats for tax filing and portfolio review.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Calculator Section -->
    <section id="calculator" class="py-5 bg-light">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white">
                            <h3 class="card-title mb-0">Upload Your IBKR Transaction File</h3>
                        </div>
                        <div class="card-body">
                            <form id="calculatorForm" enctype="multipart/form-data">
                                <div class="mb-4">
                                    <div class="upload-area" id="uploadArea">
                                        <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                                        <h5>Drag & Drop your CSV or QFX file here</h5>
                                        <p class="text-muted">or click to browse</p>
                                        <input type="file" id="fileInput" name="file" accept=".csv,.qfx,.ofx" class="d-none">
                                    </div>
                                    <small class="form-text text-muted mt-2">
                                        Upload your Interactive Brokers transaction file (CSV or QFX format)
                                    </small>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="taxYear" class="form-label">Tax Year</label>
                                            <select class="form-select" id="taxYear" name="tax_year" required>
                                                <option value="2024-2025" selected>2024-2025</option>
                                                <option value="2023-2024">2023-2024</option>
                                                <option value="2022-2023">2022-2023</option>
                                                <option value="2021-2022">2021-2022</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="analysisType" class="form-label">Analysis Type</label>
                                            <select class="form-select" id="analysisType" name="analysis_type" required>
                                                <option value="both" selected>Tax & Portfolio Analysis</option>
                                                <option value="tax">Tax Analysis Only</option>
                                                <option value="portfolio">Portfolio Analysis Only</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary btn-lg" id="calculateBtn">
                                        <i class="fas fa-calculator me-2"></i>Calculate Tax & Portfolio
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar Ad -->
                <div class="col-lg-4">
                    <div class="ad-container">
                        <!-- AdSense Sidebar Ad -->
                        <ins class="adsbygoogle"
                             style="display:block"
                             data-ad-client="ca-pub-YOUR_ADSENSE_ID"
                             data-ad-slot="YOUR_SIDEBAR_SLOT_ID"
                             data-ad-format="auto"
                             data-full-width-responsive="true"></ins>
                        <script>
                             (adsbygoogle = window.adsbygoogle || []).push({});
                        </script>
                    </div>
                    
                    <!-- Amazon Associates Recommendations -->
                    <div class="card mt-4">
                        <div class="card-header">
                            <h6 class="mb-0">Recommended Resources</h6>
                        </div>
                        <div class="card-body">
                            <!-- Amazon Associates Links -->
                            <div class="mb-3">
                                <a href="https://amzn.to/YOUR_AFFILIATE_LINK" target="_blank" class="text-decoration-none">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-primary text-white d-flex align-items-center justify-content-center me-3" style="width: 60px; height: 80px; border-radius: 5px;"><i class="fas fa-book"></i></div>
                                        <div>
                                            <h6 class="mb-1">UK Tax Guide 2024</h6>
                                            <small class="text-muted">Complete tax planning guide</small>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            
                            <div class="mb-3">
                                <a href="https://amzn.to/YOUR_AFFILIATE_LINK" target="_blank" class="text-decoration-none">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-success text-white d-flex align-items-center justify-content-center me-3" style="width: 60px; height: 80px; border-radius: 5px;"><i class="fas fa-chart-line"></i></div>
                                        <div>
                                            <h6 class="mb-1">Portfolio Tracker Pro</h6>
                                            <small class="text-muted">Advanced portfolio management</small>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <p>&copy; 2024 IBKR Tax Calculator. All rights reserved.</p>
                </div>
                <div class="col-md-6 text-end">
                    <a href="/privacy" class="text-white me-3">Privacy Policy</a>
                    <a href="/terms" class="text-white">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Custom JavaScript -->
    <script>
        // File upload handling
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const form = document.getElementById('calculatorForm');
        const calculateBtn = document.getElementById('calculateBtn');

        // Click to upload
        uploadArea.addEventListener('click', () => {
            const currentFileInput = document.getElementById('fileInput');
            if (currentFileInput) {
                currentFileInput.click();
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                updateUploadArea(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                updateUploadArea(e.target.files[0]);
            }
        });

        // Store the selected file globally
        let selectedFile = null;

        function updateUploadArea(file) {
            // Store the file
            selectedFile = file;

            uploadArea.innerHTML = `
                <i class="fas fa-file-csv fa-3x text-success mb-3"></i>
                <h5 class="text-success">File Selected: ${file.name}</h5>
                <p class="text-muted">Size: ${(file.size / 1024).toFixed(2)} KB</p>
                <input type="file" id="fileInput" name="file" accept=".csv,.qfx,.ofx" class="d-none">
            `;

            // Re-attach event listeners to the new file input
            const newFileInput = document.getElementById('fileInput');
            newFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    updateUploadArea(e.target.files[0]);
                }
            });

            // Set the file on the new input using DataTransfer
            const dt = new DataTransfer();
            dt.items.add(file);
            newFileInput.files = dt.files;
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            console.log('Form submit event triggered');
            e.preventDefault();

            // Check if file is selected
            const fileInputElement = document.getElementById('fileInput');
            console.log('File input files:', fileInputElement.files);
            console.log('File input files length:', fileInputElement.files.length);
            if (fileInputElement.files.length > 0) {
                console.log('File selected:', fileInputElement.files[0].name, 'Size:', fileInputElement.files[0].size);
            } else {
                console.log('WARNING: No file selected!');
                alert('Please select a file before submitting.');
                return;
            }

            calculateBtn.disabled = true;
            calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';

            const formData = new FormData(form);

            // Debug FormData contents
            console.log('FormData created, contents:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(key + ':', value.name, 'Size:', value.size);
                } else {
                    console.log(key + ':', value);
                }
            }

            // Determine the correct endpoint based on the current URL
            const isCustomDomain = !window.location.hostname.includes('execute-api');
            const endpoint = isCustomDomain ? '/calculate' : '/prod/calculate';

            console.log('Submitting to', endpoint);

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });

                console.log('Response received:', response.status);

                if (response.ok) {
                    const result = await response.text();
                    console.log('Results received, updating page');
                    document.body.innerHTML = result;
                } else {
                    throw new Error('Calculation failed');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                alert('Error processing your file. Please try again.');
                calculateBtn.disabled = false;
                calculateBtn.innerHTML = '<i class="fas fa-calculator me-2"></i>Calculate Tax & Portfolio';
            }
        });

        console.log('JavaScript loaded successfully');
    </script>
</body>
</html>
    """
