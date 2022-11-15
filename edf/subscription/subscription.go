package subscription

import (
	"fmt"

	"golang.org/x/exp/slices"
)

var subscriptions = map[Option]map[Power]float64{
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

// BaseAvailablePowers are the available powers.
var BaseAvailablePowers = []Power{Power3kVA, Power6kVA, Power9kVA, Power12kVA, Power15kVA, Power18kVA}

// OffPeakHoursAvailablePowers are the available powers.
var OffPeakHoursAvailablePowers = []Power{Power6kVA, Power9kVA, Power12kVA, Power15kVA, Power18kVA}

// PerMonthSubscription returns the amount of the subscription for one month.
func PerMonthSubscription(option Option, power Power) (float64, error) {
	switch option {
	case BaseOption:
		if !slices.Contains(BaseAvailablePowers, power) {
			return 0, fmt.Errorf("invalid power (%dkVA) for this option (%s)", power, option)
		}
	case OffPeakHoursOption:
		if !slices.Contains(OffPeakHoursAvailablePowers, power) {
			return 0, fmt.Errorf("invalid power (%dkVA) for this option (%s)", power, option)
		}
	default:
		return 0, fmt.Errorf("option does not exist")
	}

	return subscriptions[option][power], nil
}

// PerYearSubscription returns the amount of the subscription for one year.
func PerYearSubscription(option Option, power Power) (float64, error) {
	pm, err := PerMonthSubscription(option, power)

	return pm * 12, err
}
