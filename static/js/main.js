document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'dashboard') {
                loadDashboardData();
            }
        });
    });

    // Form submission
    const predictionForm = document.getElementById('predictionForm');
    const predictionResult = document.getElementById('predictionResult');

    predictionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(predictionForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = key === 'Oldpeak' ? parseFloat(value) : parseInt(value);
        });

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            // Display prediction result
            predictionResult.classList.remove('hidden');
            const riskLevel = predictionResult.querySelector('.risk-level');
            const probability = predictionResult.querySelector('.probability');
            const recommendation = predictionResult.querySelector('.recommendation');

            riskLevel.textContent = result.risk_level;
            riskLevel.style.color = result.prediction === 1 ? '#e74c3c' : '#2ecc71';
            probability.textContent = `Probability: ${(result.probability * 100).toFixed(2)}%`;
            
            // Add recommendation based on risk level
            // Create insights HTML
            const insightsHtml = result.insights.map(insight => `<li>${insight}</li>`).join('');
            
            // Create metrics analysis HTML
            const metricsHtml = `
                <div class="metrics-analysis">
                    <h4>Health Metrics Analysis:</h4>
                    <div class="metric ${result.metrics_analysis.blood_pressure_category.toLowerCase()}">
                        Blood Pressure: ${result.metrics_analysis.blood_pressure_category}
                    </div>
                    <div class="metric ${result.metrics_analysis.cholesterol_category.toLowerCase()}">
                        Cholesterol: ${result.metrics_analysis.cholesterol_category}
                    </div>
                    <div class="metric ${result.metrics_analysis.age_risk.toLowerCase()}">
                        Age-Related Risk: ${result.metrics_analysis.age_risk}
                    </div>
                </div>
            `;

            if (result.prediction === 1) {
                recommendation.innerHTML = `
                    <strong>Recommended Actions:</strong>
                    <ul>
                        <li>Schedule an immediate consultation with a cardiologist</li>
                        <li>Monitor blood pressure and heart rate regularly</li>
                        <li>Follow a heart-healthy diet</li>
                        <li>Consider stress reduction techniques</li>
                    </ul>
                    <div class="insights-section">
                        <h4>Personalized Health Insights:</h4>
                        <ul class="insights-list">
                            ${insightsHtml}
                        </ul>
                    </div>
                    ${metricsHtml}`;
            } else {
                recommendation.innerHTML = `
                    <strong>Preventive Measures:</strong>
                    <ul>
                        <li>Maintain regular check-ups</li>
                        <li>Continue healthy lifestyle habits</li>
                        <li>Stay physically active</li>
                        <li>Monitor cholesterol levels</li>
                    </ul>
                    <div class="insights-section">
                        <h4>Personalized Health Insights:</h4>
                        <ul class="insights-list">
                            ${insightsHtml}
                        </ul>
                    </div>
                    ${metricsHtml}`;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while making the prediction. Please try again.');
        }
    });

    // Dashboard functionality
    async function loadDashboardData() {
        try {
            const response = await fetch('/data/statistics');
            const data = await response.json();

            // Age Distribution Chart
            const ageTrace = {
                x: Object.keys(data.age_distribution),
                y: Object.values(data.age_distribution),
                type: 'bar',
                name: 'Age Distribution',
                marker: {color: '#3498db'}
            };
            Plotly.newPlot('ageDistribution', [ageTrace], {
                title: 'Age Distribution',
                xaxis: {title: 'Age'},
                yaxis: {title: 'Count'}
            });

            // Gender Distribution Chart
            const genderTrace = {
                labels: ['Male', 'Female'],
                values: [data.gender_distribution['1'], data.gender_distribution['0']],
                type: 'pie',
                marker: {
                    colors: ['#3498db', '#e74c3c']
                }
            };
            Plotly.newPlot('genderDistribution', [genderTrace], {
                title: 'Gender Distribution'
            });

            // Heart Disease Distribution Chart
            const heartDiseaseTrace = {
                labels: ['No Heart Disease', 'Heart Disease'],
                values: [
                    data.heart_disease_distribution['0'],
                    data.heart_disease_distribution['1']
                ],
                type: 'pie',
                marker: {
                    colors: ['#2ecc71', '#e74c3c']
                }
            };
            Plotly.newPlot('heartDiseaseDistribution', [heartDiseaseTrace], {
                title: 'Heart Disease Distribution'
            });

            // Correlation Heatmap
            const correlationData = {
                z: [Object.values(data.correlation_matrix)],
                x: Object.keys(data.correlation_matrix),
                y: ['Correlation'],
                type: 'heatmap',
                colorscale: 'RdBu'
            };
            Plotly.newPlot('correlationHeatmap', [correlationData], {
                title: 'Feature Correlation with Heart Disease',
                xaxis: {tickangle: 45}
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
});
