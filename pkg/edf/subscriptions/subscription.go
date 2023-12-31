package subscriptions

type Subscription interface {
	KiloWattHourPrice() float64
	CalculateSummary() *Summary
}

/* var subscriptions = map[Option]map[Power]float64{
	BaseOption: {
		Power3kVA:  8.65,
		Power6kVA:  11.36,
		Power9kVA:  14.18,
		Power12kVA: 17.02,
		Power15kVA: 19.71,
		Power18kVA: 22.66,
	},
	OffPeakHoursOption: {
		Power6kVA:  11.84,
		Power9kVA:  15.26,
		Power12kVA: 18.67,
		Power15kVA: 21.81,
		Power18kVA: 24.42,
	},
} */
