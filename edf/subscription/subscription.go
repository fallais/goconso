package subscription

import (
	"fmt"

	"golang.org/x/exp/slices"
)

var SubscriptionsPerMonth = map[Option]map[Power]float64{
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
}

// PerYearSubscription returns the amount of the subscription for one year.
func PerYearSubscription(option Option, power Power) (float64, error) {
	if option < BaseOption || option > OffPeakHoursOption {
		return 0, fmt.Errorf("option does not exist")
	}
	if option == BaseOption && !slices.Contains([]Power{Power3kVA, Power6kVA, Power9kVA, Power12kVA, Power15kVA, Power18kVA}, power) {
		return 0, fmt.Errorf("invalid power for this option")
	}
	if option == OffPeakHoursOption && !slices.Contains([]Power{Power6kVA, Power9kVA, Power12kVA, Power15kVA, Power18kVA}, power) {
		return 0, fmt.Errorf("invalid power for this option")
	}

	return SubscriptionsPerMonth[option][power] * 12, nil
}
