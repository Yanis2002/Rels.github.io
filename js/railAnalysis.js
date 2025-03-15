// Function to generate smooth noise
function generateSmoothNoise(length, amplitude = 1.0, frequency = 0.1) {
  const x = Array.from({ length }, (_, i) => i);
  let noise = Array(length).fill(0);

  // Combine multiple sinusoids with different frequencies
  for (let i = 3; i < 8; i++) {
    const phase = Math.random();
    const freq = frequency * (i / 5);
    
    for (let j = 0; j < length; j++) {
      noise[j] += (Math.random() * amplitude / i) * Math.sin(2 * Math.PI * freq * x[j] + phase);
    }
  }
  
  return noise;
}

// Generate ideal rail profile
function generateIdealRailProfile(length = 500) {
  // Create base rail profile as a zero line
  return Array(length).fill(0);
}

// Generate defect rail profile
function generateDefectRailProfile(length = 500, defectAmplitude = 0.5, defectFrequency = 0.05) {
  // Start with ideal rail
  const profile = generateIdealRailProfile(length);
  
  // Add smooth defects
  const defects = generateSmoothNoise(length, defectAmplitude, defectFrequency);
  
  // Return profile with defects
  return profile.map((val, i) => val + defects[i]);
}

// Calculate defect integral - Simpson's integration replacement
function calculateDefectIntegral(idealProfile, defectProfile) {
  // Calculate absolute difference
  const difference = idealProfile.map((val, i) => Math.abs(defectProfile[i] - val));
  
  // Simple trapezoid rule integration
  let integral = 0;
  for (let i = 1; i < difference.length; i++) {
    integral += 0.5 * (difference[i-1] + difference[i]);
  }
  
  return { integral, difference };
}

// Function to create rail visualization data for Plotly
function createRailsData(rail1Top, rail1Bottom, rail2Top, rail2Bottom, x) {
  // Rail distance
  const railDistance = 10;
  
  return [
    // First rail top
    {
      x: x,
      y: rail1Top,
      type: 'scatter',
      mode: 'lines',
      name: 'Rail 1 (top)',
      line: { color: 'red', width: 2 }
    },
    // First rail bottom
    {
      x: x,
      y: rail1Bottom,
      type: 'scatter',
      mode: 'lines',
      name: 'Rail 1 (bottom)',
      line: { color: 'red', width: 2 },
      fill: 'tonexty',
      fillcolor: 'rgba(255, 0, 0, 0.3)'
    },
    // Second rail top
    {
      x: x,
      y: rail2Top.map(v => v + railDistance),
      type: 'scatter',
      mode: 'lines',
      name: 'Rail 2 (top)',
      line: { color: 'green', width: 2 }
    },
    // Second rail bottom
    {
      x: x,
      y: rail2Bottom.map(v => v + railDistance),
      type: 'scatter',
      mode: 'lines',
      name: 'Rail 2 (bottom)',
      line: { color: 'green', width: 2 },
      fill: 'tonexty',
      fillcolor: 'rgba(0, 255, 0, 0.3)'
    }
  ];
}

// Function to create defect analysis data for Plotly
function createDefectsAnalysisData(idealTop, defectTop, idealBottom, defectBottom, x, diffTop, diffBottom, integralTop, integralBottom) {
  // Find common Y-axis limits
  const allValues = [...idealTop, ...defectTop, ...idealBottom, ...defectBottom];
  const yMin = Math.min(...allValues) - 0.05;
  const yMax = Math.max(...allValues) + 0.05;
  
  // Find common difference limits
  const diffValues = [...diffTop, ...diffBottom];
  const diffMax = Math.max(...diffValues) + 0.02;
  
  // Create data for top profile
  const topProfileData = [
    {
      x: x,
      y: idealTop,
      type: 'scatter',
      mode: 'lines',
      name: 'Ideal Profile',
      line: { color: 'blue', width: 1 }
    },
    {
      x: x,
      y: defectTop,
      type: 'scatter',
      mode: 'lines',
      name: 'Defect Profile',
      line: { color: 'red', width: 1 }
    }
  ];
  
  // Create data for bottom profile
  const bottomProfileData = [
    {
      x: x,
      y: idealBottom,
      type: 'scatter',
      mode: 'lines',
      name: 'Ideal Profile',
      line: { color: 'blue', width: 1 }
    },
    {
      x: x,
      y: defectBottom,
      type: 'scatter',
      mode: 'lines',
      name: 'Defect Profile',
      line: { color: 'red', width: 1 }
    }
  ];
  
  // Create data for top profile differences
  const topDiffData = [
    {
      x: x,
      y: diffTop,
      type: 'scatter',
      mode: 'none',
      name: 'Top Defects',
      fill: 'tozeroy',
      fillcolor: 'rgba(255, 0, 0, 0.5)'
    }
  ];
  
  // Create data for bottom profile differences
  const bottomDiffData = [
    {
      x: x,
      y: diffBottom,
      type: 'scatter',
      mode: 'none',
      name: 'Bottom Defects',
      fill: 'tozeroy',
      fillcolor: 'rgba(255, 0, 0, 0.5)'
    }
  ];
  
  return {
    topProfileData,
    bottomProfileData,
    topDiffData,
    bottomDiffData,
    yMin,
    yMax,
    diffMax
  };
}

// Function to evaluate rail condition
function evaluateCondition(integral) {
  if (integral < 20) {
    return { condition: "Excellent", color: "green" };
  } else if (integral < 50) {
    return { condition: "Good", color: "blue" };
  } else if (integral < 100) {
    return { condition: "Requires attention", color: "orange" };
  } else {
    return { condition: "Requires replacement", color: "red" };
  }
}

// Function to generate all rail data
function generateRailData() {
  try {
    // Get parameters from form
    const length = parseInt(document.getElementById('length').value) || 500;
    const amplitude = parseFloat(document.getElementById('amplitude').value) || 0.3;
    const frequency = parseFloat(document.getElementById('frequency').value) || 0.02;
    const railHeight = 3; // rail height in mm
    const x = Array.from({ length }, (_, i) => i);
    
    // Generate ideal rail profiles
    const idealTop1 = generateIdealRailProfile(length);
    const idealBottom1 = idealTop1.map(v => v - railHeight);
    
    const idealTop2 = generateIdealRailProfile(length);
    const idealBottom2 = idealTop2.map(v => v - railHeight);
    
    // Generate defect rail profiles
    const defectTop1 = generateDefectRailProfile(length, amplitude, frequency);
    const defectBottomBase1 = defectTop1.map(v => v - railHeight);
    const defectBottomDefects1 = generateDefectRailProfile(length, 0.2, 0.03);
    const defectBottom1 = defectBottomBase1.map((v, i) => v + defectBottomDefects1[i]);
    
    const defectTop2 = generateDefectRailProfile(length, 0.4, 0.015);
    const defectBottomBase2 = defectTop2.map(v => v - railHeight);
    const defectBottomDefects2 = generateDefectRailProfile(length, 0.25, 0.025);
    const defectBottom2 = defectBottomBase2.map((v, i) => v + defectBottomDefects2[i]);
    
    // Calculate defect integrals
    const { integral: integralTop1, difference: diffTop1 } = calculateDefectIntegral(idealTop1, defectTop1);
    const { integral: integralBottom1, difference: diffBottom1 } = calculateDefectIntegral(idealBottom1, defectBottom1);
    
    const { integral: integralTop2, difference: diffTop2 } = calculateDefectIntegral(idealTop2, defectTop2);
    const { integral: integralBottom2, difference: diffBottom2 } = calculateDefectIntegral(idealBottom2, defectBottom2);
    
    // Create rails visualization data
    const railsData = createRailsData(defectTop1, defectBottom1, defectTop2, defectBottom2, x);
    
    // Create defects analysis data
    const defects1Data = createDefectsAnalysisData(
      idealTop1, defectTop1, idealBottom1, defectBottom1,
      x, diffTop1, diffBottom1, integralTop1, integralBottom1
    );
    
    const defects2Data = createDefectsAnalysisData(
      idealTop2, defectTop2, idealBottom2, defectBottom2,
      x, diffTop2, diffBottom2, integralTop2, integralBottom2
    );
    
    // Calculate total integrals
    const totalIntegral1 = integralTop1 + integralBottom1;
    const totalIntegral2 = integralTop2 + integralBottom2;
    
    // Evaluate conditions
    const evaluation1 = evaluateCondition(totalIntegral1);
    const evaluation2 = evaluateCondition(totalIntegral2);
    
    // Update the UI with the data
    // Display integral values
    document.getElementById('integralTop1').textContent = integralTop1.toFixed(2) + ' mm²';
    document.getElementById('integralBottom1').textContent = integralBottom1.toFixed(2) + ' mm²';
    document.getElementById('totalIntegral1').textContent = totalIntegral1.toFixed(2) + ' mm²';
    
    document.getElementById('integralTop2').textContent = integralTop2.toFixed(2) + ' mm²';
    document.getElementById('integralBottom2').textContent = integralBottom2.toFixed(2) + ' mm²';
    document.getElementById('totalIntegral2').textContent = totalIntegral2.toFixed(2) + ' mm²';
    
    // Display assessments
    const assessment1 = document.getElementById('assessment1');
    assessment1.textContent = evaluation1.condition;
    assessment1.style.backgroundColor = evaluation1.color;
    
    const assessment2 = document.getElementById('assessment2');
    assessment2.textContent = evaluation2.condition;
    assessment2.style.backgroundColor = evaluation2.color;
    
    // Plot rails overview
    Plotly.newPlot('railsChart', railsData, {
        title: 'Railway Rail Profiles',
        xaxis: { title: 'Distance (cm)' },
        yaxis: { title: 'Height (mm)' }
    });
    
    // Plot first rail analysis
    // Top profile
    Plotly.newPlot('topProfile1', defects1Data.topProfileData, {
        title: 'Top Rail Profile',
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Height (mm)',
            range: [defects1Data.yMin, defects1Data.yMax]
        }
    });
    
    // Bottom profile
    Plotly.newPlot('bottomProfile1', defects1Data.bottomProfileData, {
        title: 'Bottom Rail Profile',
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Height (mm)',
            range: [defects1Data.yMin, defects1Data.yMax]
        }
    });
    
    // Top defects
    Plotly.newPlot('topDiff1', defects1Data.topDiffData, {
        title: `Top Profile Defects (Integral: ${integralTop1.toFixed(2)} mm²)`,
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Defect (mm)',
            range: [0, defects1Data.diffMax]
        }
    });
    
    // Bottom defects
    Plotly.newPlot('bottomDiff1', defects1Data.bottomDiffData, {
        title: `Bottom Profile Defects (Integral: ${integralBottom1.toFixed(2)} mm²)`,
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Defect (mm)',
            range: [0, defects1Data.diffMax]
        }
    });
    
    // Plot second rail analysis
    // Top profile
    Plotly.newPlot('topProfile2', defects2Data.topProfileData, {
        title: 'Top Rail Profile',
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Height (mm)',
            range: [defects2Data.yMin, defects2Data.yMax]
        }
    });
    
    // Bottom profile
    Plotly.newPlot('bottomProfile2', defects2Data.bottomProfileData, {
        title: 'Bottom Rail Profile',
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Height (mm)',
            range: [defects2Data.yMin, defects2Data.yMax]
        }
    });
    
    // Top defects
    Plotly.newPlot('topDiff2', defects2Data.topDiffData, {
        title: `Top Profile Defects (Integral: ${integralTop2.toFixed(2)} mm²)`,
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Defect (mm)',
            range: [0, defects2Data.diffMax]
        }
    });
    
    // Bottom defects
    Plotly.newPlot('bottomDiff2', defects2Data.bottomDiffData, {
        title: `Bottom Profile Defects (Integral: ${integralBottom2.toFixed(2)} mm²)`,
        xaxis: { title: 'Distance (cm)' },
        yaxis: { 
            title: 'Defect (mm)',
            range: [0, defects2Data.diffMax]
        }
    });
    
  } catch (error) {
    console.error('Error generating rail data:', error);
    alert('Error generating rail data: ' + error.message);
  }
}
