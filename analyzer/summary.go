package analyzer

import (
	"goconso/edf/kilowatt"
	"goconso/edf/subscription"
)

type DayNightSubscriptionSummary struct {
	PriceHC      float64
	PriceHP      float64
	TotalIndex   int
	Subscription float64
	Total        float64
}

type BaseSubscriptionSummary struct {
	TotalIndex   int
	Subscription float64
	Total        float64
}

func sumUpDayNightSubscription(indexHC, indexHP int, power subscription.Power) *DayNightSubscriptionSummary {
	// Calculate the price for HC and HP
	priceHC := float64(indexHC) * kilowatt.KiloWattHourOffPeakPrice
	priceHP := float64(indexHP) * kilowatt.KiloWattHourFullHoursPrice

	// Calculate the subscription for one yea
	subscription := subscription.PerYearSubscription(subscription.DayNightOption, power)

	return &DayNightSubscriptionSummary{
		PriceHC:      priceHC,
		PriceHP:      float64(indexHP) * kilowatt.KiloWattHourFullHoursPrice,
		TotalIndex:   indexHC + indexHP,
		Subscription: subscription,
		Total:        priceHC + priceHP + subscription,
	}
}

func sumUpBaseSubscription(index int, power subscription.Power) *BaseSubscriptionSummary {
	// Calculate the subscription for one yea
	subscription := subscription.PerYearSubscription(subscription.BaseOption, power)

	return &BaseSubscriptionSummary{
		TotalIndex:   index,
		Subscription: subscription,
		Total:        float64(index)*kilowatt.KiloWattHourBasePrice + subscription,
	}

}
