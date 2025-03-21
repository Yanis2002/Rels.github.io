// Server setup using Express.js
const express = require('express');
const app = express();
const path = require('path');

// Serve static files from the current directory
app.use(express.static(__dirname));

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

// Function to generate realistic rail profile
function generateRealisticRailProfile(length = 500) {
  // Create base rail profile with proper geometry
  const profile = Array(length).fill(0);
  
  // Add very subtle long-wavelength variations to simulate natural rail bending
  const longWave = generateSmoothNoise(length, 0.05, 0.001);
  
  // Add medium-wavelength variations for rail wear
  const mediumWave = generateSmoothNoise(length, 0.02, 0.005);
  
  // Add short-wavelength variations for surface roughness
  const shortWave = generateSmoothNoise(length, 0.01, 0.02);
  
  // Combine all variations
  return profile.map((val, i) => val + longWave[i] + mediumWave[i] + shortWave[i]);
}

// Function to create train car model
function createTrainCar(x, y, scale = 1) {
  const carWidth = 20 * scale;
  const carHeight = 15 * scale;
  const wheelRadius = 2 * scale;
  
  return {
    x: x,
    y: y,
    width: carWidth,
    height: carHeight,
    wheelRadius: wheelRadius,
    wheels: [
      { x: x - carWidth/3, y: y + carHeight/2, radius: wheelRadius },
      { x: x + carWidth/3, y: y + carHeight/2, radius: wheelRadius }
    ]
  };
}

// Function to update train car position
function updateTrainCar(car, rail1Top, rail2Top, x, position) {
  const index = Math.floor(position);
  const nextIndex = Math.min(index + 1, rail1Top.length - 1);
  const t = position - index;
  
  // Interpolate rail heights
  const rail1Height = rail1Top[index] * (1 - t) + rail1Top[nextIndex] * t;
  const rail2Height = rail2Top[index] * (1 - t) + rail2Top[nextIndex] * t;
  
  // Update car position
  car.x = position;
  car.y = (rail1Height + rail2Height) / 2 - car.height/2;
  
  // Update wheel positions
  car.wheels[0].x = car.x - car.width/3;
  car.wheels[1].x = car.x + car.width/3;
  car.wheels[0].y = car.y + car.height/2;
  car.wheels[1].y = car.y + car.height/2;
  
  return car;
}

// Function to create train car visualization data
function createTrainCarData(car) {
  return [
    // Car body
    {
      x: [car.x - car.width/2, car.x + car.width/2, car.x + car.width/2, car.x - car.width/2],
      y: [car.y, car.y, car.y + car.height, car.y + car.height],
      type: 'scatter',
      mode: 'lines+fill',
      fill: 'toself',
      fillcolor: 'rgba(100, 100, 100, 0.8)',
      line: { color: 'black', width: 2 }
    },
    // Wheels
    ...car.wheels.map(wheel => ({
      x: wheel.x,
      y: wheel.y,
      type: 'scatter',
      mode: 'markers',
      marker: {
        size: wheel.radius * 2,
        color: 'black',
        line: { color: 'white', width: 1 }
      }
    }))
  ];
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

// Main route
app.get('/', (req, res) => {
  // Serve the Рельсы.HTML file
  res.sendFile(path.join(__dirname,'Templates','Рельсы.HTML'));
});

// API route to get rail data
app.get('/api/rail-data', (req, res) => {
  try {
    // Parameters
    const length = parseInt(req.query.length) || 500;
    const railHeight = 3;
    const amplitude = parseFloat(req.query.amplitude) || 0.3;
    const frequency = parseFloat(req.query.frequency) || 0.02;
    const x = Array.from({ length }, (_, i) => i);
    
    // Generate ideal rail profiles
    const idealTop1 = generateIdealRailProfile(length);
    const idealBottom1 = idealTop1.map(v => v - railHeight);
    
    const idealTop2 = generateIdealRailProfile(length);
    const idealBottom2 = idealTop2.map(v => v - railHeight);
    
    // Generate realistic defect rail profiles
    const defectTop1 = generateRealisticRailProfile(length);
    const defectBottomBase1 = defectTop1.map(v => v - railHeight);
    const defectBottomDefects1 = generateRealisticRailProfile(length);
    const defectBottom1 = defectBottomBase1.map((v, i) => v + defectBottomDefects1[i] * 0.5);
    
    const defectTop2 = generateRealisticRailProfile(length);
    const defectBottomBase2 = defectTop2.map(v => v - railHeight);
    const defectBottomDefects2 = generateRealisticRailProfile(length);
    const defectBottom2 = defectBottomBase2.map((v, i) => v + defectBottomDefects2[i] * 0.5);
    
    // Create train car
    const trainCar = createTrainCar(length/2, 0);
    const trainCarData = createTrainCarData(trainCar);
    
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
    
    // Send data
    res.json({
      railsData,
      defects1Data,
      defects2Data,
      trainCarData,
      integralTop1,
      integralBottom1,
      totalIntegral1,
      integralTop2,
      integralBottom2,
      totalIntegral2,
      evaluation1,
      evaluation2,
      x
    });
  } catch (error) {
    console.error('Error generating rail data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
