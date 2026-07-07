# Value limits

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const ASPECTS = {
        "edu low": {
            pricePerProvision: 0.6,
            pricePerCapacity: 0,
        },
        "edu high": {
            pricePerProvision: 0.8,
            pricePerCapacity: 0,
        },
        "health": {
            pricePerProvision: 0.01,
            pricePerCapacity: 0,
        },
        "waste": {
            pricePerProvision: 0.2,
            pricePerCapacity: 0.0002,
        },
        "body": {
            pricePerProvision: 1.0,
            pricePerCapacity: 0.005,
        }
    }

    const MAX_INFLUENCE_MONTHLY_PRICE = 100_000;
    const MAX_INFLUENCE_PER_TILE = 8000;
    const MAX_INFLUENCE_PER_MONTHLY_PRICE = 9;
    const MAX_INFLUENCE_OFFSET = 15;

    const MAX_INFLUENCE_PER_TILE_UNSUPPORTED = 2000;
    const MAX_INFLUENCE_PER_MONTHLY_PRICE_UNSUPPORTED = 1;
    const MAX_INFLUENCE_OFFSET_UNSUPPORTED = 5;

    // Computes the maximum water limit based on area and monthly price.
    // Values above this limit will be clamped to the maximum allowed by the game logic.
    function computeWaterLimit(area, monthlyPrice) {
        const MAX_WATER_PER_AREA = 10_000;
        const MAX_WATER_PER_MONTHLY_PRICE = 200;
        const MAX_WATER_OFFSET = 80;
        const MAX_WATER = 10_000_000;
        const waterByArea = MAX_WATER_PER_AREA * area;
        const waterByPrice = (MAX_WATER_PER_MONTHLY_PRICE * monthlyPrice) + MAX_WATER_OFFSET;
        return Math.min(waterByArea, Math.min(waterByPrice, MAX_WATER));
    }

    // Computes the maximum power limit based on area and monthly price.
    // Values above this limit will be clamped to the maximum allowed by the game logic.
    function computePowerLimit(area, monthlyPrice) {
        const MAX_POWER_PER_AREA = 10_000;
        const MAX_POWER_PER_MONTHLY_PRICE = 200;
        const MAX_POWER_OFFSET = 80;
        const MAX_POWER = 10_000_000;
        const powerByArea = MAX_POWER_PER_AREA * area;
        const powerByPrice = (MAX_POWER_PER_MONTHLY_PRICE * monthlyPrice) + MAX_POWER_OFFSET;
        return Math.min(powerByArea, Math.min(powerByPrice, MAX_POWER));
    }

    // Computes the maximum supported influence limit based on area and monthly price.
    // Values above this limit will be clamped to the maximum allowed by the game logic.
    function computeSupportedInfluenceLimit(area, monthlyPrice) {
        const clampedPrice = Math.min(monthlyPrice, MAX_INFLUENCE_MONTHLY_PRICE);
        const influenceByPrice = MAX_INFLUENCE_PER_MONTHLY_PRICE * clampedPrice;
        const influenceByPriceArea = influenceByPrice / area;
        return Math.min(influenceByPriceArea + MAX_INFLUENCE_OFFSET, MAX_INFLUENCE_PER_TILE)
    }

    // Computes the maximum unsupported influence limit based on area and monthly price.
    // Values above this limit will be clamped to the maximum allowed by the game logic.
    function computeUnsupportedInfluenceLimit(area, monthlyPrice) {
        const clampedPrice = Math.min(monthlyPrice, MAX_INFLUENCE_MONTHLY_PRICE);
        const influenceByPrice = MAX_INFLUENCE_PER_MONTHLY_PRICE_UNSUPPORTED * clampedPrice;
        const influenceByPriceArea = influenceByPrice / area;
        return Math.min(influenceByPriceArea + MAX_INFLUENCE_OFFSET_UNSUPPORTED, MAX_INFLUENCE_PER_TILE_UNSUPPORTED)
    }
</script>
<template id="mechanics-chart-template">
    <style>
        .controls { margin-bottom: 15px; display: flex; gap: 20px; }
        .control-group { display: flex; flex-direction: column; }
        .chart-container { position: relative; height: 300px; width: 100%; }
        .value-display { font-weight: bold; }
    </style>
    <div class="controls">
        <div class="control-group">
        <label>
            <span class="x-label">Building Width</span>: 
            <span class="x-val value-display">4</span> <span class="x-unit">tiles</span>
        </label>
        <input type="range" class="x-slider" min="1" max="16" value="4">
        </div>
        <div class="control-group">
        <label>
            <span class="y-label">Building Height</span>: 
            <span class="y-val value-display">4</span> <span class="y-unit">tiles</span>
        </label>
        <input type="range" class="y-slider" min="1" max="16" value="4">
        </div>
    </div>
    <div class="chart-container">
        <canvas class="chart-canvas"></canvas>
    </div>
</template>
<script>
class MechanicsChart extends HTMLElement {
  connectedCallback() {
    const template = document.getElementById('mechanics-chart-template');
    this.appendChild(template.content.cloneNode(true));

    this.xSlider = this.querySelector('.x-slider');
    this.ySlider = this.querySelector('.y-slider');
    this.xVal = this.querySelector('.x-val');
    this.yVal = this.querySelector('.y-val');
    this.canvasCtx = this.querySelector('.chart-canvas').getContext('2d');

    this.configureAttributes();

    // Default configuration (Fallback if you don't provide custom data specs)
    this.chartConfig = {
      xAxisTitle: 'Monthly Price',
      yAxisTitle: 'Max Allowed Capability Ceiling',
      generateDatasets: (x, y) => {
        const labels = [];
        const data1 = [];
        const area = x * y;
        for (let price = 0; price <= 25000; price += 1000) {
          labels.push(price);
          data1.push(area * (price / 5000));
        }
        return {
          labels: labels,
          datasets: [{ label: 'Default Metric', data: data1, borderColor: '#3498db' }]
        };
      }
    };

    // Initialize chart with layout shell
    this.initChart();
    
    this.xSlider.addEventListener('input', () => this.updateDimensions());
    this.ySlider.addEventListener('input', () => this.updateDimensions());
    
    this.updateDimensions();
  }

  // Method to inject custom data configurations from external scripts
  setCustomData(config) {
    this.chartConfig = { ...this.chartConfig, ...config };
    
    // Update structural chart features like Axis Titles
    this.chart.options.scales.x.title.text = this.chartConfig.xAxisTitle;
    this.chart.options.scales.y.title.text = this.chartConfig.yAxisTitle;
    
    this.updateDimensions();
  }

  configureAttributes() {
    this.querySelector('.x-label').textContent = this.getAttribute('x-label') || 'Width';
    this.querySelector('.y-label').textContent = this.getAttribute('y-label') || 'Height';
    this.querySelector('.x-unit').textContent = this.getAttribute('x-unit') || 'tiles';
    this.querySelector('.y-unit').textContent = this.getAttribute('y-unit') || 'tiles';
    this.xSlider.min = this.getAttribute('x-min') || '1';
    this.xSlider.max = this.getAttribute('x-max') || '16';
    this.xSlider.value = this.getAttribute('x-value') || '4';
    this.ySlider.min = this.getAttribute('y-min') || '1';
    this.ySlider.max = this.getAttribute('y-max') || '16';
    this.ySlider.value = this.getAttribute('y-value') || '4';
  }

  initChart() {
    this.chart = new Chart(this.canvasCtx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: '' } },
          y: { title: { display: true, text: '' }, beginAtZero: true }
        },
        plugins: { tooltip: { mode: 'index', intersect: false } }
      }
    });
  }

  updateDimensions() {
    const x = parseInt(this.xSlider.value);
    const y = parseInt(this.ySlider.value);

    this.xVal.textContent = x;
    this.yVal.textContent = y;

    // Run the custom mapping function passing the current dynamic slider values
    const payload = this.chartConfig.generateDatasets(x, y);
    
    this.chart.data.labels = payload.labels;
    this.chart.data.datasets = payload.datasets.map((dataset, index) => {
      // Retain existing datasets styles or apply clean line defaults dynamically
      return {
        tension: 0.1,
        borderWidth: 2.5,
        ...dataset
      };
    });
    
    this.chart.update();
  }
}
customElements.define('mechanics-chart', MechanicsChart);
</script>


Game automatically enforces certain limits on attributes irrespective of what value is actually supplied in the Json definition.

These attributes include, but are not limited to are water, power and influences.

## Water and power limits

Let $S$ be the building area and $P$ the monthly price. The resource limit is determined by the lower bound of an area factor, a price factor, and a hard cap:

$$
\text{Max Value} = \min(S \cdot C_s, (P \cdot C_p) + C_o, C_{max})
$$

Where the constants apply to each resource respectively:

- $C_s$: Maximum resource per unit of area
- $C_p$: Maximum resource per unit of monthly price
- $C_o$: Resource offset value
- $C_{max}$: Absolute maximum resource cap

You may use the graph below to visualize how adjustments to building area ($S$) and monthly price ($P$) impact the final maximum value.

<mechanics-chart id="waterPowerChart"></mechanics-chart>
<script>
document.getElementById('waterPowerChart').setCustomData({
    xAxisTitle: 'Monthly Price',
    yAxisTitle: 'Max Value',
    generateDatasets: (width, height) => {
        const area = width * height;
        const labels = [];
        const waterValues = [];
        const powerValues = [];
        for (let price = 0; price <= 15000; price += 500) {
            labels.push(`${price}`);
            waterValues.push(computeWaterLimit(area, price))
            powerValues.push(computePowerLimit(area, price))
        }
        return {
            labels: labels,
            datasets: [
                {
                    label: 'Water Limit',
                    data: waterValues,
                    borderColor: '#3490db'
                },
                {
                    label: 'Power Limit',
                    data: powerValues,
                    borderColor: '#e4e73c'
                },
            ]
        };
    }
});
</script>

## Influence limits

Buildings have supported and unsupported influences. For example, a "health" influence is supported on a medical building, but unsupported on a police station. Unsupported influences are heavily penalized.

Like before, let $S$ be the building area and $P$ the monthly price. The maximum influence value is calculated as:

$$
\text{Max Value} = \min(\frac{C_p \cdot min(P, C_{pmax})}{S} + C_o, C_{max})
$$

Where the constants represent:

- $C_p$: Maximum value per unit of monthly price
- $C_{pmax}$: Maximum monthly price cap that affects the calculation
- $C_o$: Value offset
- $C_{max}$: Absolute maximum value cap

You may use the graph below to visualize how adjustments to building area ($S$) and monthly price ($P$) impact the final maximum value.

<mechanics-chart id="influenceChart"></mechanics-chart>
<script>
document.getElementById('influenceChart').setCustomData({
    xAxisTitle: 'Monthly Price',
    yAxisTitle: 'Max Value',
    generateDatasets: (width, height) => {
        const area = width * height;
        const labels = [];
        const supportedInf = [];
        const unsupportedInf = [];
        for (let price = 0; price <= 50000; price += 1000) {
            labels.push(`${price}`);
            supportedInf.push(computeSupportedInfluenceLimit(area, price))
            unsupportedInf.push(computeUnsupportedInfluenceLimit(area, price))
        }
        return {
            labels: labels,
            datasets: [
                {
                    label: 'Supported Influence Limit',
                    data: supportedInf,
                    borderColor: '#34db34'
                },
                {
                    label: 'Unsupported Influence Limit',
                    data: unsupportedInf,
                    borderColor: '#e74c3c'
                },
            ]
        };
    }
});
</script>
