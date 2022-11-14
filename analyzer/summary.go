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

func sumUpDayNightSubscription(indexHC, indexHP int) *DayNightSubscriptionSummary {
	// Calculate the price for HC and HP
	priceHC := float64(indexHC) * kilowatt.KiloWattHourOffPeakPrice
	priceHP := float64(indexHP) * kilowatt.KiloWattHourFullHoursPrice

	// Calculate the subscription for one yea
	subscription := subscription.PerYearSubscription(subscription.DayNightOption, subscription.Power12kVA)

	return &DayNightSubscriptionSummary{
		PriceHC:      priceHC,
		PriceHP:      float64(indexHP) * kilowatt.KiloWattHourFullHoursPrice,
		TotalIndex:   indexHC + indexHP,
		Subscription: subscription,
		Total:        priceHC + priceHP + subscription,
	}
}

func sumUpBaseSubscription(index int) *BaseSubscriptionSummary {
	// Calculate the subscription for one yea
	subscription := subscription.PerYearSubscription(subscription.BaseOption, subscription.Power12kVA)

	return &BaseSubscriptionSummary{
		TotalIndex:   index,
		Subscription: subscription,
		Total:        float64(index)*kilowatt.KiloWattHourBasePrice + subscription,
	}

}
