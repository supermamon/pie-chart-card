# Lovelace pie chart card

This card will display a doughnut chart based on your specified entities. This was based on https://github.com/cheelio/power-usage-card. 

## Usage
1. Add plugin .js as a module:
```
- url: /local/pie-chart-card.js
  type: module
```
2. Add lovelace card to view:
```
- type: "custom:pie-chart-card"                    # Mandatory
  title: "Example Pie Chart"                       # Optional customized title
  total_amount: sensor.total_amount                # Optional total value of pie chart.
                                                   # If available then other measured values will be 
                                                   # substracted from total to calculate 'unknown' value.
  unknownText: "Onbekend"                          # Optional customized unknown text. Only applicable
                                                   # with total_amount option enabled.
  entities:
    - entity: sensor.example_1                     # One or more entities providing amounts
      name: Slice 1                                # Optional customized name for entity
    - entity: sensor.example_2
      name: Slice 4
    - entity: sensor.example_3
      name: Slice 3
    ...
 ```

<img src="https://raw.githubusercontent.com/sdelliot/pie-chart-card/master/pie-chart-card.png" width="500">
