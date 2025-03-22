// Глобальные переменные
let railData = null;
let rail1TopProfile = null;
let rail2TopProfile = null;
let plotLayout = null;

// Функция для генерации плавного шума
function generateSmoothNoise(length, amplitude = 1.0, frequency = 0.1) {
    const x = Array.from({ length }, (_, i) => i);
    let noise = Array(length).fill(0);

    for (let i = 3; i < 8; i++) {
        const phase = Math.random();
        const noiseFreq = frequency * (i / 5);
        
        for (let j = 0; j < length; j++) {
            noise[j] += (Math.random() * amplitude / i) * Math.sin(2 * Math.PI * noiseFreq * x[j] + phase);
        }
    }
    
    return noise;
}

// Функция для генерации идеального профиля рельса
function generateIdealRailProfile(length = 500) {
    return Array(length).fill(0);
}

// Функция для генерации впадин
function generateDepressions(length, numDepressions = 5) {
    const depressions = [];
    for (let i = 0; i < numDepressions; i++) {
        const position = Math.floor(Math.random() * length);
        const depth = -(Math.random() * 0.5 + 0.2);
        const width = Math.floor(Math.random() * 10) + 5;
        depressions.push({ position, depth, width });
    }
    return depressions;
}

// Функция для генерации реалистичного профиля рельса
function generateRealisticRailProfile(length = 500) {
    const profile = Array(length).fill(0);
    
    const longWave = generateSmoothNoise(length, 0.15, 0.001);
    const mediumWave = generateSmoothNoise(length, 0.1, 0.005);
    const shortWave = generateSmoothNoise(length, 0.05, 0.02);
    
    const depressions = generateDepressions(length);
    
    const finalProfile = profile.map((val, i) => {
        let value = val + longWave[i] + mediumWave[i] + shortWave[i];
        depressions.forEach(depression => {
            const distance = Math.abs(i - depression.position);
            if (distance < depression.width) {
                const influence = Math.cos((distance / depression.width) * Math.PI) * 0.5 + 0.5;
                value += depression.depth * influence;
            }
        });
        return value;
    });

    return { profile: finalProfile, depressions };
}

// Функция для обновления позиции тележки
function updateTrainPosition(event) {
    if (!railData || !plotLayout) return;
    
    const plot = document.getElementById('railPlot');
    const rect = plot.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
    
    const xaxis = document.getElementById('railPlot')._fullLayout.xaxis;
    const yaxis = document.getElementById('railPlot')._fullLayout.yaxis;
    
    const plotX = xaxis.p2d(x);
    
    const index = Math.floor((plotX / xaxis.range[1]) * rail1TopProfile.length);
    if (index < 0 || index >= rail1TopProfile.length) return;
    
    const y1 = rail1TopProfile[index];
    const y2 = rail2TopProfile[index] + 10;
    
    const wheelRadius = 0.4;
    const bodyWidth = 3;
    const bodyLength = 6;
    const wheelOffset = bodyLength / 3;
    
    const wheels = [
        { x: plotX - wheelOffset/2, y: y1 },
        { x: plotX + wheelOffset/2, y: y1 },
        { x: plotX - wheelOffset/2, y: y2 },
        { x: plotX + wheelOffset/2, y: y2 }
    ];
    
    const trainCarData = railData.slice(-3);
    
    trainCarData[1].x = wheels.map(w => w.x);
    trainCarData[1].y = wheels.map(w => w.y);
    trainCarData[1].mode = 'markers';
    trainCarData[1].marker = {
        size: wheelRadius * 15,
        color: 'black',
        symbol: 'circle'
    };
    
    const bodyPoints = [
        [plotX - wheelOffset/2 - wheelRadius, y1 + bodyWidth/4],
        [plotX + wheelOffset/2 + wheelRadius, y1 + bodyWidth/4],
        [plotX + wheelOffset/2 + wheelRadius, y2 - bodyWidth/4],
        [plotX - wheelOffset/2 - wheelRadius, y2 - bodyWidth/4],
        [plotX - wheelOffset/2 - wheelRadius, y1 + bodyWidth/4]
    ];
    
    trainCarData[0].x = bodyPoints.map(p => p[0]);
    trainCarData[0].y = bodyPoints.map(p => p[1]);
    trainCarData[0].fill = 'toself';
    trainCarData[0].fillcolor = 'rgba(50, 50, 50, 0.9)';
    trainCarData[0].line = { color: 'black', width: 2 };
    
    trainCarData[2].x = [
        wheels[0].x, wheels[2].x,
        null,
        wheels[1].x, wheels[3].x
    ];
    trainCarData[2].y = [
        wheels[0].y, wheels[2].y,
        null,
        wheels[1].y, wheels[3].y
    ];
    trainCarData[2].mode = 'lines';
    trainCarData[2].line = { color: 'black', width: 2 };
    
    Plotly.update('railPlot', {
        x: trainCarData.map(d => d.x),
        y: trainCarData.map(d => d.y)
    }, {}, [railData.length - 3, railData.length - 2, railData.length - 1]);
}

// Функция для создания данных визуализации
function createVisualizationData(length = 500) {
    const railHeight = 3;
    const x = Array.from({ length }, (_, i) => i);
    
    const idealTop1 = generateIdealRailProfile(length);
    const idealBottom1 = idealTop1.map(v => v - railHeight);
    
    const { profile: realTop1, depressions: depressions1 } = generateRealisticRailProfile(length);
    const realBottom1 = realTop1.map(v => v - railHeight + generateSmoothNoise(length, 0.05, 0.02)[0]);
    
    const { profile: realTop2, depressions: depressions2 } = generateRealisticRailProfile(length);
    const realBottom2 = realTop2.map(v => v - railHeight + generateSmoothNoise(length, 0.05, 0.02)[0]);
    
    return {
        x,
        rail1: {
            top: realTop1,
            bottom: realBottom1,
            idealTop: idealTop1,
            idealBottom: idealBottom1,
            depressions: depressions1
        },
        rail2: {
            top: realTop2,
            bottom: realBottom2,
            idealTop: idealTop1,
            idealBottom: idealBottom1,
            depressions: depressions2
        }
    };
}

// Функция для расчета интеграла дефектов
function calculateDefectIntegral(realProfile, idealProfile) {
    return realProfile.reduce((sum, real, i) => sum + Math.abs(real - idealProfile[i]), 0);
}

// Функция для оценки состояния рельса
function assessRailCondition(totalIntegral) {
    if (totalIntegral < 10) {
        return { text: "Отличное состояние", color: "#4CAF50" };
    } else if (totalIntegral < 20) {
        return { text: "Хорошее состояние", color: "#8BC34A" };
    } else if (totalIntegral < 30) {
        return { text: "Удовлетворительное состояние", color: "#FFC107" };
    } else if (totalIntegral < 40) {
        return { text: "Требует внимания", color: "#FF9800" };
    } else {
        return { text: "Требует срочного ремонта", color: "#F44336" };
    }
}

// Функция для обновления информации о дефектах
function updateDefectInfo(railNumber, data) {
    const topIntegral = calculateDefectIntegral(data[`rail${railNumber}`].top, data[`rail${railNumber}`].idealTop);
    const bottomIntegral = calculateDefectIntegral(data[`rail${railNumber}`].bottom, data[`rail${railNumber}`].idealBottom);
    const totalIntegral = topIntegral + bottomIntegral;

    document.getElementById(`integralTop${railNumber}`).textContent = topIntegral.toFixed(2);
    document.getElementById(`integralBottom${railNumber}`).textContent = bottomIntegral.toFixed(2);
    document.getElementById(`totalIntegral${railNumber}`).textContent = totalIntegral.toFixed(2);

    const assessment = assessRailCondition(totalIntegral);
    const assessmentElement = document.getElementById(`assessment${railNumber}`);
    assessmentElement.textContent = assessment.text;
    assessmentElement.style.backgroundColor = assessment.color;
}

// Функция для создания графика профиля
function createProfileChart(containerId, x, realProfile, idealProfile, title) {
    const data = [
        {
            x: x,
            y: realProfile,
            type: 'scatter',
            mode: 'lines',
            name: 'Реальный профиль',
            line: { color: 'blue' }
        },
        {
            x: x,
            y: idealProfile,
            type: 'scatter',
            mode: 'lines',
            name: 'Идеальный профиль',
            line: { color: 'gray', dash: 'dash' }
        }
    ];

    const layout = {
        title: title,
        xaxis: { title: 'Distance (cm)' },
        yaxis: { title: 'Height (mm)' },
        height: 300,
        margin: { l: 50, r: 50, t: 30, b: 30 }
    };

    Plotly.newPlot(containerId, data, layout);
}

// Функция для создания графика разницы профилей
function createDifferenceChart(containerId, x, realProfile, idealProfile, title) {
    const difference = realProfile.map((real, i) => real - idealProfile[i]);
    
    const data = [{
        x: x,
        y: difference,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'red' },
        fill: 'tozeroy'
    }];

    const layout = {
        title: title,
        xaxis: { title: 'Distance (cm)' },
        yaxis: { title: 'Difference (mm)' },
        height: 300,
        margin: { l: 50, r: 50, t: 30, b: 30 }
    };

    Plotly.newPlot(containerId, data, layout);
}

// Функция для обновления всех графиков дефектов
function updateDefectCharts(railNumber, data) {
    createProfileChart(
        `topProfile${railNumber}`,
        data.x,
        data[`rail${railNumber}`].top,
        data[`rail${railNumber}`].idealTop,
        'Верхний профиль'
    );
    
    createProfileChart(
        `bottomProfile${railNumber}`,
        data.x,
        data[`rail${railNumber}`].bottom,
        data[`rail${railNumber}`].idealBottom,
        'Нижний профиль'
    );
    
    createDifferenceChart(
        `topDiff${railNumber}`,
        data.x,
        data[`rail${railNumber}`].top,
        data[`rail${railNumber}`].idealTop,
        'Отклонение верхнего профиля'
    );
    
    createDifferenceChart(
        `bottomDiff${railNumber}`,
        data.x,
        data[`rail${railNumber}`].bottom,
        data[`rail${railNumber}`].idealBottom,
        'Отклонение нижнего профиля'
    );
}

// Обновляем инициализацию при загрузке страницы
window.onload = function() {
    const data = createVisualizationData();
    
    rail1TopProfile = data.rail1.top;
    rail2TopProfile = data.rail2.top;
    
    const расстояниеМеждуРельсами = 10;
    
    const rail1TopData = {
        x: data.x,
        y: data.rail1.top,
        type: 'scatter',
        mode: 'lines',
        name: 'Рельс 1 (верх)',
        line: { color: 'red', width: 4 }
    };
    
    const rail1BottomData = {
        x: data.x,
        y: data.rail1.bottom,
        type: 'scatter',
        mode: 'lines',
        name: 'Рельс 1 (низ)',
        line: { color: 'red', width: 4 },
        fill: 'tonexty',
        fillcolor: 'rgba(255, 0, 0, 0.4)'
    };
    
    const rail2TopData = {
        x: data.x,
        y: data.rail2.top.map(v => v + расстояниеМеждуРельсами),
        type: 'scatter',
        mode: 'lines',
        name: 'Рельс 2 (верх)',
        line: { color: 'green', width: 4 }
    };
    
    const rail2BottomData = {
        x: data.x,
        y: data.rail2.bottom.map(v => v + расстояниеМеждуРельсами),
        type: 'scatter',
        mode: 'lines',
        name: 'Рельс 2 (низ)',
        line: { color: 'green', width: 4 },
        fill: 'tonexty',
        fillcolor: 'rgba(0, 255, 0, 0.4)'
    };
    
    const trainCarBody = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        fill: 'toself',
        fillcolor: 'rgba(50, 50, 50, 0.9)',
        line: { color: 'black', width: 2 },
        showlegend: false
    };
    
    const trainCarWheels = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'markers',
        marker: {
            size: 6,
            color: 'black'
        },
        showlegend: false
    };
    
    const trainCarAxles = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        line: { color: 'black', width: 2 },
        showlegend: false
    };
    
    railData = [rail1TopData, rail1BottomData, rail2TopData, rail2BottomData, trainCarBody, trainCarWheels, trainCarAxles];
    
    plotLayout = {
        title: 'Профили рельсов',
        xaxis: {
            title: 'Расстояние (см)',
            range: [0, 500],
            fixedrange: false
        },
        yaxis: {
            title: 'Высота (мм)',
            range: [-5, 15],
            fixedrange: false
        },
        showlegend: true,
        hovermode: 'closest',
        dragmode: 'zoom',
        margin: {
            l: 50,
            r: 50,
            t: 50,
            b: 50
        }
    };
    
    Plotly.newPlot('railPlot', railData, plotLayout, {
        scrollZoom: true,
        displayModeBar: true,
        responsive: true
    });
    
    // Обновляем информацию о дефектах для обоих рельсов
    updateDefectInfo(1, data);
    updateDefectInfo(2, data);
    
    // Обновляем графики дефектов для обоих рельсов
    updateDefectCharts(1, data);
    updateDefectCharts(2, data);
    
    document.getElementById('railPlot').addEventListener('mousemove', updateTrainPosition);
}; 