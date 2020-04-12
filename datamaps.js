window.addEventListener("load", function () {
	// check out: https://frappe.io/charts/docs
	Vue.view("datamaps-chart", {
		mixins: [nabu.page.views.data.DataCommon],
		category: "Charts",
		name: "Datamaps",
		description: "This plugin allows you to draw a world map with some statistics",
		icon: "images/components/datamaps-logo.png",
		props: {
			page: {
				type: Object,
				required: true
			},
			parameters: {
				type: Object,
				required: false
			},
			cell: {
				type: Object,
				required: true
			},
			edit: {
				type: Boolean,
				required: true
			}
		},
		data: function() {
			return {
				configuring: false,
				instance: null
			}
		},
		beforeDestroy: function() {
			this.$services.page.destroy(this);
		},
		created: function() {
			this.create();
			if (!this.cell.state.bindings) {
				Vue.set(this.cell.state, "bindings", {});
			}
			if (!this.cell.state.fills) {
				Vue.set(this.cell.state, "fills", []);
			}
		},
		activate: function(done) {
			var self = this;
			this.activate(function() {
				done();
			}, done);
		},
		ready: function() {
			this.draw();
		},
		methods: {
			configure: function() {
				this.configuring = true;	
			},
			getKeys: function(name) {
				return this.keys.filter(function(x) {
					return !name || x.toLowerCase().indexOf(name.toLowerCase()) >= 0;
				});
			},
			draw: function() {
				var data = {};
				var self = this;
				
				var maximum = null;
				if (self.cell.state.amountField) {
					maximum = this.records.reduce(function(max, x) {
						var amount = self.$services.page.getValue(x, self.cell.state.amountField);
						return amount != null && (max == null || amount > max) ? amount : max;
					}, null);
				}
				
				var popupTemplate = function(bubble) {
					return function(geo, data) {
						var keys = {};
						var result = {data:data, geo:geo};
						self.$services.page.explode(keys, result);
						var text = bubble 
							? (self.cell.state.bubbleLabel ? self.cell.state.bubbleLabel : "{data." + self.cell.state.amountField + "}")
							: (self.cell.state.countryLabel ? self.cell.state.countryLabel : "{geo.properties.name}")
						Object.keys(keys).forEach(function(key) {
							text = text.replace(new RegExp("{[\s]*" + key + "[\s]*}"), self.$services.page.getValue(result, key));
						});
						// if we have unresolved variables, fall back
						if (text.match(new RegExp("{.+}"))) {
							text = geo.properties.name;
						}
						return "<div class='hoverinfo'>" + text + "</div>"
					}
				}
				
				nabu.utils.elements.clear(this.$refs.chart);
				
				if (this.cell.state.countryCodeField) {
					this.records.forEach(function(record) {
						var code = self.$services.page.getValue(record, self.cell.state.countryCodeField);
						if (code) {
							data[code] = nabu.utils.objects.clone(record);
							if (self.cell.state.countryFillField) {
								var fill = self.$services.page.getValue(record, self.cell.state.countryFillField);
								if (fill) {
									data[code].fillKey = fill;
								}
							}
							else if (self.cell.state.amountField && maximum != null && self.cell.state.fills) {
								var amount = self.$services.page.getValue(record, self.cell.state.amountField);
								if (amount != null) {
									var percent = (amount / maximum) * 100;
									var lowestMatch = Number.MAX_VALUE;
									self.cell.state.fills.forEach(function(x) {
										if (x.maxPercent && percent < parseFloat(x.maxPercent) && parseFloat(x.maxPercent) < lowestMatch) {
											data[code].fillKey = x.name;
											lowestMatch = parseFloat(x.maxPercent);
										}
									});
								}
							}
						}
					});
				}
				
				var fills = {};
				fills.defaultFill = this.cell.state.defaultFill ? this.cell.state.defaultFill : "#ABDDA4";
				if (this.cell.state.fills) {
					this.cell.state.fills.forEach(function(fill) {
						if (fill.name && fill.color) {
							fills[fill.name] = fill.color;
						}
					});
				}
				
				this.instance = new Datamaps({
					scope: 'world',
					element: this.$refs.chart,
					projection: 'mercator',
					zoomable: this.cell.state.zoomable,
					fills: fills,
					data: data,
					geographyConfig: {
						clickHandler: function(data, geo) {
							self.select(data);
						},
						popupTemplate: popupTemplate(false)
					}
				});
				
				var bubbles = [];
				
				if (this.cell.state.amountField && this.cell.state.countryCodeField && this.cell.state.bubbleRadius) {
					var minimum = Number.MAX_VALUE;
					var maximum = Number.MIN_VALUE;
					var hasAny = false;
					// we need to deduce the maximum and minimum value so we can divide the radius correctly
					this.records.forEach(function(x) {
						var amount = self.$services.page.getValue(x, self.cell.state.amountField);
						if (amount != null) {
							hasAny = true;
							if (amount > maximum) {
								maximum = amount;
							}
							if (amount < minimum) {
								minimum = amount;
							}
						}
					});
					if (hasAny) {
						var radius = this.cell.state.bubbleRadius;
						if (radius == null) {
							radius = 50;
						}
						else {
							radius = parseInt(radius);
						}
						var factor = maximum == minimum ? radius : radius / (maximum - minimum);
						this.records.forEach(function(x) {
							var code = self.$services.page.getValue(x, self.cell.state.countryCodeField);
							var amount = self.$services.page.getValue(x, self.cell.state.amountField);
							if (amount != null && code != null) {
								var fill = self.cell.state.bubbleFillField ? self.$services.page.getValue(x, self.cell.state.bubbleFillField) : null;
								var clone = nabu.utils.objects.clone(x);
								clone.fillKey = fill;
								clone.radius = factor * amount;
								clone.centered = code;
								bubbles.push(clone);
							}
						});
					}
				}
				
				if (bubbles.length) {
					this.instance.bubbles(bubbles, {
						popupTemplate: popupTemplate(true)
					});
/*					this.instance.bubbles([
						{centered: 'MEX', fillKey: '000000', radius: 30, yield: 10},
						{centered: 'CAN', fillKey: 'average', radius: 5, yield: 20},
						{centered: 'BRA', fillKey: 'good', radius: 15, yield: 30},
						{centered: 'USA', fillKey: 'bad', radius: 46, yield: 40},
						{centered: 'JPN', fillKey: 'good', radius: 2, yield: 50},
					], {
						popupTemplate: function(geo, data) {
							return '<div class="hoverinfo">Yield:' + data.yield + 'Exploded on ' + data.date + ' by the '  + data.country + ''
						}
					});*/
				}
			}
		}
	});
});





