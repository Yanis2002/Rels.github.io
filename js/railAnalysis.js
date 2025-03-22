// Настройка сервера с использованием Express.js
const express = require('express');
const app = express();
const path = require('path');

// Обслуживание статических файлов из текущей директории
app.use(express.static(__dirname));

// Функция для генерации плавного шума
function генерироватьПлавныйШум(длина, амплитуда = 1.0, частота = 0.1) {
  const x = Array.from({ length: длина }, (_, i) => i);
  let шум = Array(длина).fill(0);

  // Комбинирование нескольких синусоид с разными частотами
  for (let i = 3; i < 8; i++) {
    const фаза = Math.random();
    const частотаШума = частота * (i / 5);
    
    for (let j = 0; j < длина; j++) {
      шум[j] += (Math.random() * амплитуда / i) * Math.sin(2 * Math.PI * частотаШума * x[j] + фаза);
    }
  }
  
  return шум;
}

// Генерация идеального профиля рельса
function генерироватьИдеальныйПрофильРельса(длина = 500) {
  // Создание базового профиля рельса как нулевой линии
  return Array(длина).fill(0);
}

// Функция для генерации случайных впадин на рельсе
function генерироватьВпадины(длина, количествоВпадин = 5) {
  const впадины = [];
  for (let i = 0; i < количествоВпадин; i++) {
    const позиция = Math.floor(Math.random() * длина);
    const глубина = -(Math.random() * 0.5 + 0.2); // глубина впадины от 0.2 до 0.7
    const ширина = Math.floor(Math.random() * 10) + 5; // ширина впадины от 5 до 15
    впадины.push({ позиция, глубина, ширина });
  }
  return впадины;
}

// Функция для создания данных маркеров впадин
function создатьДанныеМаркеровВпадин(впадины, профиль) {
  return {
    x: впадины.map(в => в.позиция),
    y: впадины.map(в => профиль[в.позиция]), // Теперь маркеры будут прямо на рельсе
    type: 'scatter',
    mode: 'markers',
    name: 'Впадины',
    marker: {
      size: 12,
      color: 'red',
      symbol: 'circle',
      line: { color: 'white', width: 2 }
    }
  };
}

// Функция для генерации случайных точек измерения между верхней и нижней частями рельса
function генерироватьТочкиИзмерения(длина, количествоТочек = 5) {
  const точки = [];
  const минимальноеРасстояние = длина / (количествоТочек * 2); // Минимальное расстояние между точками
  
  while (точки.length < количествоТочек) {
    const позиция = Math.floor(Math.random() * длина);
    
    // Проверяем, достаточно ли далеко эта точка от уже существующих
    const достаточноДалеко = точки.every(т => Math.abs(т.позиция - позиция) >= минимальноеРасстояние);
    
    if (достаточноДалеко) {
      точки.push({
        позиция,
        смещение: Math.random() // Случайное положение между верхней и нижней частями рельса
      });
    }
  }
  return точки;
}

// Функция для создания данных визуализации точек измерения
function создатьДанныеТочекИзмерения(точки, верхнийПрофиль, нижнийПрофиль) {
  return {
    x: точки.map(т => т.позиция),
    y: точки.map(т => {
      const верх = верхнийПрофиль[т.позиция];
      const низ = нижнийПрофиль[т.позиция];
      return низ + (верх - низ) * т.смещение; // Интерполяция между верхом и низом
    }),
    type: 'scatter',
    mode: 'markers',
    name: 'Точки измерения',
    marker: {
      size: 12,
      color: 'red',
      symbol: 'circle',
      line: { color: 'white', width: 2 }
    }
  };
}

// Функция для генерации реалистичного профиля рельса
function генерироватьРеалистичныйПрофильРельса(длина = 500) {
  // Создание базового профиля рельса с правильной геометрией
  const профиль = Array(длина).fill(0);
  
  // Добавление очень тонких длинноволновых вариаций для имитации естественного изгиба рельса
  const длиннаяВолна = генерироватьПлавныйШум(длина, 0.15, 0.001); // Увеличена амплитуда
  
  // Добавление средневолновых вариаций для износа рельса
  const средняяВолна = генерироватьПлавныйШум(длина, 0.1, 0.005); // Увеличена амплитуда
  
  // Добавление коротковолновых вариаций для шероховатости поверхности
  const короткаяВолна = генерироватьПлавныйШум(длина, 0.05, 0.02); // Увеличена амплитуда
  
  // Генерация случайных впадин
  const впадины = генерироватьВпадины(длина);
  
  // Комбинирование всех вариаций и добавление впадин
  return {
    профиль: профиль.map((val, i) => {
      let значение = val + длиннаяВолна[i] + средняяВолна[i] + короткаяВолна[i];
      // Добавление впадин
      впадины.forEach(впадина => {
        const расстояние = Math.abs(i - впадина.позиция);
        if (расстояние < впадина.ширина) {
          const влияние = Math.cos((расстояние / впадина.ширина) * Math.PI) * 0.5 + 0.5;
          значение += впадина.глубина * влияние;
        }
      });
      return значение;
    }),
    впадины
  };
}

// Функция для создания модели вагона
function создатьВагон(x, y, масштаб = 1) {
  const ширинаВагона = 60 * масштаб;
  const высотаВагона = 30 * масштаб;
  const радиусКолеса = 8 * масштаб;
  const расстояниеМеждуРельсами = 10; // Добавляем константу для расстояния между рельсами
  
  return {
    x: x,
    y: y,
    ширина: ширинаВагона,
    высота: высотаВагона,
    радиусКолеса: радиусКолеса,
    колеса: [
      // Левые колеса (для первого рельса)
      { x: x - ширинаВагона/3, y: y, радиус: радиусКолеса },
      // Правые колеса (для второго рельса)
      { x: x + ширинаВагона/3, y: y + расстояниеМеждуРельсами, радиус: радиусКолеса }
    ],
    рессоры: [
      { x1: x - ширинаВагона/3, x2: x - ширинаВагона/4, y: y + высотаВагона/4 },
      { x1: x + ширинаВагона/4, x2: x + ширинаВагона/3, y: y + высотаВагона/4 }
    ]
  };
}

// Функция для обновления позиции вагона
function обновитьПозициюВагона(вагон, рельс1Верх, рельс2Верх, x, позиция) {
  const индекс = Math.floor(позиция);
  const следующийИндекс = Math.min(индекс + 1, рельс1Верх.length - 1);
  const t = позиция - индекс;
  
  // Интерполяция высоты рельсов
  const высотаРельса1 = рельс1Верх[индекс];
  const высотаРельса2 = рельс2Верх[индекс] + 10; // Добавляем смещение для второго рельса
  
  // Обновление позиции вагона
  вагон.x = позиция;
  вагон.y = высотаРельса1;
  
  // Обновление позиций колес
  вагон.колеса[0].x = вагон.x - вагон.ширина/3;
  вагон.колеса[0].y = высотаРельса1;
  
  вагон.колеса[1].x = вагон.x + вагон.ширина/3;
  вагон.колеса[1].y = высотаРельса2;
  
  // Обновление позиций рессор
  вагон.рессоры[0].x1 = вагон.x - вагон.ширина/3;
  вагон.рессоры[0].x2 = вагон.x - вагон.ширина/4;
  вагон.рессоры[0].y = вагон.y + вагон.высота/4;
  
  вагон.рессоры[1].x1 = вагон.x + вагон.ширина/4;
  вагон.рессоры[1].x2 = вагон.x + вагон.ширина/3;
  вагон.рессоры[1].y = вагон.y + вагон.высота/4;
  
  return вагон;
}

// Функция для создания данных визуализации вагона
function создатьДанныеВизуализацииВагона(вагон) {
  return [
    // Корпус вагона
    {
      x: [вагон.x - вагон.ширина/2, вагон.x + вагон.ширина/2, вагон.x + вагон.ширина/2, вагон.x - вагон.ширина/2, вагон.x - вагон.ширина/2],
      y: [вагон.y + вагон.высота/2, вагон.y + вагон.высота/2, вагон.y + вагон.высота*1.5, вагон.y + вагон.высота*1.5, вагон.y + вагон.высота/2],
      type: 'scatter',
      mode: 'lines',
      name: 'Вагон',
      fill: 'toself',
      fillcolor: 'rgba(100, 100, 100, 0.8)',
      line: { color: 'black', width: 3 },
      showlegend: false
    },
    // Колеса
    ...вагон.колеса.map(колесо => ({
      x: [колесо.x],
      y: [колесо.y],
      type: 'scatter',
      mode: 'markers',
      marker: {
        size: колесо.радиус * 4,
        color: 'black',
        symbol: 'circle',
        line: { color: 'white', width: 2 }
      },
      showlegend: false
    })),
    // Рессоры
    ...вагон.рессоры.map(рессора => ({
      x: [рессора.x1, рессора.x2],
      y: [рессора.y, рессора.y],
      type: 'scatter',
      mode: 'lines',
      line: { color: 'black', width: 3, dash: 'dot' },
      showlegend: false
    }))
  ];
}

// Функция для создания данных визуализации рельсов для Plotly
function создатьДанныеВизуализацииРельсов(рельс1Верх, рельс1Низ, рельс2Верх, рельс2Низ, x, вагон) {
  // Генерируем случайные точки измерения для обоих рельсов
  const точкиРельс1 = генерироватьТочкиИзмерения(x.length);
  const точкиРельс2 = генерироватьТочкиИзмерения(x.length);
  
  // Расстояние между рельсами
  const расстояниеМеждуРельсами = 10;
  
  return [
    // Верхняя часть первого рельса
    {
      x: x,
      y: рельс1Верх,
      type: 'scatter',
      mode: 'lines',
      name: 'Рельс 1 (верх)',
      line: { color: 'red', width: 4 }
    },
    // Нижняя часть первого рельса
    {
      x: x,
      y: рельс1Низ,
      type: 'scatter',
      mode: 'lines',
      name: 'Рельс 1 (низ)',
      line: { color: 'red', width: 4 },
      fill: 'tonexty',
      fillcolor: 'rgba(255, 0, 0, 0.4)'
    },
    // Точки измерения первого рельса
    создатьДанныеТочекИзмерения(точкиРельс1, рельс1Верх, рельс1Низ),
    // Верхняя часть второго рельса
    {
      x: x,
      y: рельс2Верх.map(v => v + расстояниеМеждуРельсами),
      type: 'scatter',
      mode: 'lines',
      name: 'Рельс 2 (верх)',
      line: { color: 'green', width: 4 }
    },
    // Нижняя часть второго рельса
    {
      x: x,
      y: рельс2Низ.map(v => v + расстояниеМеждуРельсами),
      type: 'scatter',
      mode: 'lines',
      name: 'Рельс 2 (низ)',
      line: { color: 'green', width: 4 },
      fill: 'tonexty',
      fillcolor: 'rgba(0, 255, 0, 0.4)'
    },
    // Точки измерения второго рельса
    {
      x: точкиРельс2.map(т => т.позиция),
      y: точкиРельс2.map(т => {
        const верх = рельс2Верх[т.позиция] + расстояниеМеждуРельсами;
        const низ = рельс2Низ[т.позиция] + расстояниеМеждуРельсами;
        return низ + (верх - низ) * т.смещение;
      }),
      type: 'scatter',
      mode: 'markers',
      name: 'Точки измерения',
      marker: {
        size: 12,
        color: 'red',
        symbol: 'circle',
        line: { color: 'white', width: 2 }
      }
    },
    // Добавляем данные вагона
    ...создатьДанныеВизуализацииВагона(вагон)
  ];
}

// Функция для оценки состояния рельса
function оценитьСостояние(интеграл) {
  if (интеграл < 20) {
    return { состояние: "Отличное", цвет: "green" };
  } else if (интеграл < 50) {
    return { состояние: "Хорошее", цвет: "blue" };
  } else if (интеграл < 100) {
    return { состояние: "Требует внимания", цвет: "orange" };
  } else {
    return { состояние: "Требует замены", цвет: "red" };
  }
}

// Функция для расчета интеграла дефектов
function calculateDefectIntegral(идеальныйПрофиль, дефектныйПрофиль) {
  // Расчет абсолютной разницы
  const разница = идеальныйПрофиль.map((val, i) => Math.abs(дефектныйПрофиль[i] - val));
  
  // Простое интегрирование по правилу трапеций
  let интеграл = 0;
  for (let i = 1; i < разница.length; i++) {
    интеграл += 0.5 * (разница[i-1] + разница[i]);
  }
  
  return { integral: интеграл, difference: разница };
}

// Функция для создания данных анализа дефектов
function createDefectsAnalysisData(идеальныйВерх, дефектныйВерх, идеальныйНиз, дефектныйНиз, x, разницаВерх, разницаНиз, интегралВерх, интегралНиз) {
  // Поиск общих пределов по оси Y
  const всеЗначения = [...идеальныйВерх, ...дефектныйВерх, ...идеальныйНиз, ...дефектныйНиз];
  const yMin = Math.min(...всеЗначения) - 0.05;
  const yMax = Math.max(...всеЗначения) + 0.05;
  
  // Поиск общих пределов разницы
  const значенияРазницы = [...разницаВерх, ...разницаНиз];
  const diffMax = Math.max(...значенияРазницы) + 0.02;
  
  // Создание данных для верхнего профиля
  const данныеВерхнегоПрофиля = [
    {
      x: x,
      y: идеальныйВерх,
      type: 'scatter',
      mode: 'lines',
      name: 'Идеальный профиль',
      line: { color: 'blue', width: 1 }
    },
    {
      x: x,
      y: дефектныйВерх,
      type: 'scatter',
      mode: 'lines',
      name: 'Профиль с дефектами',
      line: { color: 'red', width: 1 }
    }
  ];
  
  // Создание данных для нижнего профиля
  const данныеНижнегоПрофиля = [
    {
      x: x,
      y: идеальныйНиз,
      type: 'scatter',
      mode: 'lines',
      name: 'Идеальный профиль',
      line: { color: 'blue', width: 1 }
    },
    {
      x: x,
      y: дефектныйНиз,
      type: 'scatter',
      mode: 'lines',
      name: 'Профиль с дефектами',
      line: { color: 'red', width: 1 }
    }
  ];
  
  // Создание данных для разницы верхнего профиля
  const данныеРазницыВерхнего = [
    {
      x: x,
      y: разницаВерх,
      type: 'scatter',
      mode: 'none',
      name: 'Дефекты верхней части',
      fill: 'tozeroy',
      fillcolor: 'rgba(255, 0, 0, 0.5)'
    }
  ];
  
  // Создание данных для разницы нижнего профиля
  const данныеРазницыНижнего = [
    {
      x: x,
      y: разницаНиз,
      type: 'scatter',
      mode: 'none',
      name: 'Дефекты нижней части',
      fill: 'tozeroy',
      fillcolor: 'rgba(255, 0, 0, 0.5)'
    }
  ];
  
  return {
    topProfileData: данныеВерхнегоПрофиля,
    bottomProfileData: данныеНижнегоПрофиля,
    topDiffData: данныеРазницыВерхнего,
    bottomDiffData: данныеРазницыНижнего,
    yMin,
    yMax,
    diffMax
  };
}

// Основной маршрут
app.get('/', (req, res) => {
  // Отправка файла Рельсы.HTML
  res.sendFile(path.join(__dirname,'Templates','Рельсы.HTML'));
});

// API маршрут для получения данных о рельсах
app.get('/api/rail-data', (req, res) => {
  try {
    // Параметры
    const длина = parseInt(req.query.length) || 500;
    const высотаРельса = 3;
    const x = Array.from({ length: длина }, (_, i) => i);
    
    // Генерация идеальных профилей рельсов
    const идеальныйВерх1 = генерироватьИдеальныйПрофильРельса(длина);
    const идеальныйНиз1 = идеальныйВерх1.map(v => v - высотаРельса);
    
    const идеальныйВерх2 = генерироватьИдеальныйПрофильРельса(длина);
    const идеальныйНиз2 = идеальныйВерх2.map(v => v - высотаРельса);
    
    // Генерация реалистичных профилей рельсов с дефектами
    const { профиль: дефектныйВерх1, впадины: впадины1 } = генерироватьРеалистичныйПрофильРельса(длина);
    const дефектныйНизОснова1 = дефектныйВерх1.map(v => v - высотаРельса);
    const { профиль: дефектныйНизВариации1 } = генерироватьРеалистичныйПрофильРельса(длина);
    const дефектныйНиз1 = дефектныйНизОснова1.map((v, i) => v + дефектныйНизВариации1[i] * 0.5);
    
    const { профиль: дефектныйВерх2, впадины: впадины2 } = генерироватьРеалистичныйПрофильРельса(длина);
    const дефектныйНизОснова2 = дефектныйВерх2.map(v => v - высотаРельса);
    const { профиль: дефектныйНизВариации2 } = генерироватьРеалистичныйПрофильРельса(длина);
    const дефектныйНиз2 = дефектныйНизОснова2.map((v, i) => v + дефектныйНизВариации2[i] * 0.5);
    
    // Создание вагона (позиция будет обновляться на клиенте)
    const вагон = создатьВагон(0, 0, 1.5);
    
    // Создание данных визуализации рельсов (теперь включая вагон)
    const данныеРельсов = создатьДанныеВизуализацииРельсов(
      дефектныйВерх1, дефектныйНиз1, 
      дефектныйВерх2, дефектныйНиз2, 
      x,
      вагон
    );
    
    // Расчет интегралов дефектов
    const { integral: интегралВерх1, difference: разницаВерх1 } = calculateDefectIntegral(идеальныйВерх1, дефектныйВерх1);
    const { integral: интегралНиз1, difference: разницаНиз1 } = calculateDefectIntegral(идеальныйНиз1, дефектныйНиз1);
    
    const { integral: интегралВерх2, difference: разницаВерх2 } = calculateDefectIntegral(идеальныйВерх2, дефектныйВерх2);
    const { integral: интегралНиз2, difference: разницаНиз2 } = calculateDefectIntegral(идеальныйНиз2, дефектныйНиз2);
    
    // Создание данных анализа дефектов
    const данныеДефектов1 = createDefectsAnalysisData(
      идеальныйВерх1, дефектныйВерх1, идеальныйНиз1, дефектныйНиз1,
      x, разницаВерх1, разницаНиз1, интегралВерх1, интегралНиз1
    );
    
    const данныеДефектов2 = createDefectsAnalysisData(
      идеальныйВерх2, дефектныйВерх2, идеальныйНиз2, дефектныйНиз2,
      x, разницаВерх2, разницаНиз2, интегралВерх2, интегралНиз2
    );
    
    // Расчет общих интегралов
    const общийИнтеграл1 = интегралВерх1 + интегралНиз1;
    const общийИнтеграл2 = интегралВерх2 + интегралНиз2;
    
    // Оценка состояния
    const оценка1 = оценитьСостояние(общийИнтеграл1);
    const оценка2 = оценитьСостояние(общийИнтеграл2);
    
    // Добавляем профили рельсов в ответ для использования на клиенте
    res.json({
      railsData: данныеРельсов,
      defects1Data: данныеДефектов1,
      defects2Data: данныеДефектов2,
      integralTop1: интегралВерх1,
      integralBottom1: интегралНиз1,
      totalIntegral1: общийИнтеграл1,
      integralTop2: интегралВерх2,
      integralBottom2: интегралНиз2,
      totalIntegral2: общийИнтеграл2,
      evaluation1: оценка1,
      evaluation2: оценка2,
      x: x,
      rail1Top: дефектныйВерх1,
      rail2Top: дефектныйВерх2
    });
  } catch (error) {
    console.error('Ошибка при генерации данных рельсов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});
