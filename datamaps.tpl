<template id="datamaps-chart">
	<div class="datamaps-chart">
		<data-common-header :page="page" :parameters="parameters" :cell="cell"
			:edit="edit"
			:records="records"
			:selected="selected"
			:inactive="inactive"
			@updatedEvents="$emit('updatedEvents')"
			@close="$emit('close'); configuring=false"
			:multiselect="true"
			:configuring="configuring"
			:updatable="true"
			:paging="paging"
			:filters="filters"
			@refresh="refresh">

			<n-collapsible slot="settings" title="Chart Content" class="padded">
				<n-form-text v-model="cell.state.countryLabel" label="Country Label Field" @input="draw" :timeout="600"/>
				<n-form-text v-model="cell.state.bubbleLabel" label="Bubble Label Field" @input="draw" :timeout="600"/>				
				
				<n-form-switch v-model="cell.state.zoomable" label="Zoomable" @input="draw"/>
				
				<n-form-combo v-model="cell.state.countryCodeField" label="Country Code Field" 
					:filter="getKeys" @input="draw"/>
				
				<div v-if="cell.state.countryCodeField">
					<n-form-combo v-model="cell.state.countryFillField" label="Country Fill Field" 
						:filter="getKeys" @input="draw"/>
					<n-form-combo v-model="cell.state.bubbleFillField" label="Bubble Fill Field" 
						:filter="getKeys" @input="draw"/>					
					<n-form-combo v-model="cell.state.amountField" label="Amount Field" 
						:filter="getKeys" @input="draw"/>
					<n-form-text v-model="cell.state.bubbleRadius" label="Max bubble radius" v-if="cell.state.bubbleAmountField" @input="draw" :timeout="600"/>
				</div>

				<n-form-text type="color" v-model="cell.state.defaultFill" label="Default Fill" @input="draw" :timeout="600"/>
				<h2>Fill Colors<span class="subscript">Choose the fill colors you want to use</span></h2>
				<div class="list-actions">
					<button @click="cell.state.fills.push({valueFormat: {}})"><span class="fa fa-plus"></span>Fill</button>
				</div>
				<div v-for="i in Object.keys(cell.state.fills)" class="list-row">
					<n-form-text v-model="cell.state.fills[i].name" label="Name" @input="draw" :timeout="600"/>
					<n-form-text type="color" v-model="cell.state.fills[i].color" label="Color" @input="draw" :timeout="600"/>
					<span class="fa fa-times" @click="cell.state.fills.splice(i, 1); draw()"></span>
				</div>
			</n-collapsible>
		</data-common-header>
		<div class="chart" ref="chart"></div>
		<data-common-footer :page="page" :parameters="parameters" :cell="cell" 
			:edit="edit"
			:records="records"
			:selected="selected"
			:inactive="inactive"
			:global-actions="globalActions"
			@updatedEvents="$emit('updatedEvents')"
			@close="$emit('close')"
			:multiselect="true"
			:updatable="true"/>
	</div>
</template>

