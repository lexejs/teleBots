// Dpd
// 0.1 kg - 10.0 kg 29,00 zł 
// 10.1 - 31.5 kg  40,00 zł 
// 31.6 -  35.0 kg  92,87 zł 
// 35.1 - 40.0 kg  92,87 zł 
// 40.1 - 45.0 kg 125,62 zł 

// FedEx
// 45.1 - 50.0 kg  81,75 zł 
// 50.1 - 70.0 kg 114,46 zł
// +20 % 
// Размеры и вес = объёмный вес

// [\text{Объёмный вес(кг) } = \frac{ \text{ Длина(см) } \times \text{ Ширина(см) } \times \text{ Высота(см) } } { \text{ 5000 } } ]
// Вот формула
// Объёмный вес посылок рассчитывается для определения стоимости доставки, особенно в случаях, когда габариты посылки больше, чем её фактический вес.Формула для расчёта объёмного веса обычно выглядит так:
// \[\text{ Объёмный вес(кг) } = \frac{ \text{ Длина(см) } \times \text{ Ширина(см) } \times \text{ Высота(см) }}{ \text{ Делитель }} \]
// "Делитель" - это число, установленное транспортной компанией.Этот делитель может варьироваться в зависимости от компании и используемого ими стандарта измерения(например, метрическая система или имперская система).Обычно он составляет около 5000 для метрической системы, но может отличаться.
// После расчета объёмного веса, транспортная компания сравнивает его с фактическим весом посылки и использует большее значение для расчета стоимости доставки.
export default {
    getPrice: getPrice,
}

const costMultiplier = 1.2;

async function getPrice(weight, dimension1, dimension2, dimension3) {
    const volumeWeight = Math.ceil(dimension1 * dimension2 * dimension3 / 5000);
    const resultWeight = Math.max(weight, volumeWeight);

    if (resultWeight <= 10) return "deliveryType: 'DPD', price: " + 29.00 * costMultiplier;
    if (resultWeight <= 31.5) return "deliveryType: 'DPD', price: " + 40.00 * costMultiplier;
    if (resultWeight <= 40.0) return "deliveryType: 'DPD', price: " + 92.87 * costMultiplier;
    if (resultWeight <= 45.0) return "deliveryType: 'DPD', price: " + 125.62 * costMultiplier;
    if (resultWeight <= 50.0) return "deliveryType: 'FedEx', price: " + 81.75 * costMultiplier;
    if (resultWeight <= 70.0) return "deliveryType: 'FedEx', price: " + 114.46 * costMultiplier;

    return 'Not available. Please contact sales.';
}