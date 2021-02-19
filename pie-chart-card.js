import "https://unpkg.com/chart.js@v2.9.3/dist/Chart.bundle.min.js?module";
import "https://cdn.jsdelivr.net/npm/chartjs-plugin-colorschemes";


console.info(
  `%cPIE-CHART-CARD\n%cVersion: 0.2.0`,
  "color: white; background: olive; font-weight: bold;",
  "color: olive; background: white; font-weight: bold;",
  ""
);

class PieChartCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('You need to define an entity');
    }
    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);

    const card = document.createElement('ha-card');
    const content = document.createElement('div');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const style = document.createElement('style');

    card.id ='ha-card';
    content.id = 'content';
    canvas.id = 'cnv';
    content.style.height = '380px';
    canvas.height=380;
    card.appendChild(content);
    card.appendChild(style);
    content.appendChild(canvas);
    root.appendChild(card);
    this._config = config;
  }

  set hass(hass) {
    const root = this.shadowRoot;
    const config = this._config;
    const card = root.getElementById("ha-card");
    const content = root.getElementById("content");
    const canvas = root.getElementById("cnv");
    const ctx = canvas.getContext('2d');
    const hassEntities = config.entities.map(x => hass.states[x.entity]);
    
    // If a name is not provided, use the friendly_name for the entity. If the friendly_name
    // does not exist, use the actual entity.
    var entityNames = config.entities.map(x => x.name !== undefined ? x.name : hass.states[x.entity]["attributes"]["friendly_name"] !== undefined ? hass.states[x.entity]["attributes"]["friendly_name"] : x.entity);
    
    // If the entity does not exist, default to 0
    var entityData = hassEntities.map(x => x === undefined ? 0 : x.state);
    card.header = config.title ? config.title : 'Pie Chart';

    if (config.total_amount){
        const totalEntity =  hass.states[config.total_amount]
        var total = 0;
        if (totalEntity !== undefined) {
          total = totalEntity.state;
        } else if (typeof(Number(config.total_amount)) === 'number') {
          total = Number(config.total_amount);
        } else {
          console.log("ERROR: config.total_amount must be either an entity or number.")
        }
        const measured = hassEntities.map(x => Number(x.state)).reduce(( accumulator, currentValue ) => accumulator + currentValue,  0);
        entityData.push(total - measured)
        entityNames.push(config.unknownText ? config.unknownText : 'Unknown');
    }

    // rotation
    var rotation = -0.5 * Math.PI
    if (config.hasOwnProperty('rotation')) {
      try {
        var tmpRot = parseFloat(config.rotation)
        rotation = tmpRot
      } catch(e) {
        console.log("ERROR: config.rotation must evaluate to a float.")
      }
    }


    // circumference
    var circumference = 2 * Math.PI
    if (config.hasOwnProperty('circumference')) {
      try {
        var tmpCirc = parseFloat(config.circumference)
        circumference = tmpCirc
      } catch(e) {
        console.log("ERROR: config.circumference must be a float.")
      }
    }


    // hole
    var cutoutPercentage = 50
    if (config.hasOwnProperty('cutout_percentage')) {
      console.log("custom cutout_percentage received")
      try {
        var tmpCutout = parseInt(config.cutout_percentage)
        if (tmpCutout < 0 || tmpCutout > 100) {
          console.error("cutout_percentage must be an integer value from 0-99")
        } else {
          cutoutPercentage = tmpCutout
        }
      } catch(e) {
        console.error("cutout_percentage must be an integer value from 0-99")
      }
    }

    // legends
    var show_legend = true
    var legend_position = 'bottom'

    if (config.legend) {
      if (config.legend.hasOwnProperty('position')) {
        var tmpPos = config.legend.position
        if (['top','bottom','left','right'].indexOf(tmpPos)>-1) {
          legend_position = config.legend.position
        } else {
          console.error("ERROR: legend.position contains an invalid value")
        }
        
      }
      var show_legend = !!config.legend.show
    }

    // animation
    var animation = {
      animateRotate: false,
      duration: 0
    } 
    if (config.animation) {
      if (config.animation.hasOwnProperty('duration')) {
        try {
          var tmpDur = parseInt(config.animation.duration)
          animation.duration = tmpDur
        } catch(e) {
          console.error("ERROR: animation.duration must be an integer")
        }
      }
      animation.animateRotate = !!config.animation.animate
    }


    const emptyIndexes = entityData.reduce((arr, e, i) => ((e == 0) && arr.push(i), arr), [])
    entityData = entityData.filter((element, index, array) => !emptyIndexes.includes(index));
    entityNames = entityNames.filter((element, index, array) => !emptyIndexes.includes(index));

    const doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderWidth: 1,
            borderColor:'#00c0ef',
            label: 'liveCount'
          }]
        },
        options: {
            responsive: true,
            cutoutPercentage: cutoutPercentage,
            circumference: circumference,
            rotation: rotation,
            maintainAspectRatio: false, // https://stackoverflow.com/a/53233861,
            animation: animation,
            legend: {
                position: legend_position,
                display: show_legend
             },
            hover: { mode: 'index' },
            plugins: {colorschemes: { scheme: 'brewer.DarkTwo8' } },
            // https://stackoverflow.com/a/49717859
            tooltips: {
              callbacks: {
                label: function(tooltipItem, data) {
                  var dataset = data.datasets[tooltipItem.datasetIndex];
                  var meta = dataset._meta[Object.keys(dataset._meta)[0]];
                  var total = meta.total;
                  var currentValue = dataset.data[tooltipItem.index];
                  var percentage = parseFloat((currentValue/total*100).toFixed(1));
                  return currentValue + ' (' + percentage + '%)';
                },
                title: function(tooltipItem, data) {
                  return data.labels[tooltipItem[0].index];
                }
              }
            },
        }
    });

  var getData = function() {
    doughnutChart.data =  { datasets: [{ data: entityData }], labels: entityNames };
    doughnutChart.update();
  };
  getData();
  }

  getCardSize() {
    return 3;
  }
}

customElements.define('pie-chart-card', PieChartCard);
