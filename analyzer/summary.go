package analyzer

import (
	"goconso/edf/kilowatt"
	"goconso/edf/subscription"
	"log"
)

type DayNightSubscriptionSummary struct {
	IndexHC      int
	PriceHC      float64
	IndexHP      int
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

	// Calculate the subscription for one year
	subscription, err := subscription.PerYearSubscription(subscription.OffPeakHoursOption, power)
	if err != nil {
		log.Fatal("error when calculating the subscription: ", err)
	}

	return &DayNightSubscriptionSummary{
		IndexHC:      indexHC,
		PriceHC:      priceHC,
		IndexHP:      indexHP,
		PriceHP:      float64(indexHP) * kilowatt.KiloWattHourFullHoursPrice,
		TotalIndex:   indexHC + indexHP,
		Subscription: subscription,
		Total:        priceHC + priceHP + subscription,
	}
}

func sumUpBaseSubscription(index int, power subscription.Power) *BaseSubscriptionSummary {
	// Calculate the subscription for one year
	subscription, err := subscription.PerYearSubscription(subscription.BaseOption, power)
	if err != nil {
		log.Fatal("error when calculating the subscription: ", err)
	}

	return &BaseSubscriptionSummary{
		TotalIndex:   index,
		Subscription: subscription,
		Total:        float64(index)*kilowatt.KiloWattHourBasePrice + subscription,
	}

}

func calculateBreakEven(totalIndex int, power subscription.Power) int {
	// Calculate the subscription for one year
	offPeakHourSubscription, err := subscription.PerYearSubscription(subscription.OffPeakHoursOption, power)
	if err != nil {
		log.Fatal("error when calculating the subscription: ", err)
	}

	// Calculate the subscription for one year
	baseSubscription, err := subscription.PerYearSubscription(subscription.BaseOption, power)
	if err != nil {
		log.Fatal("error when calculating the subscription: ", err)
	}

	// Calculate the price for the Base option
	totalPriceForBaseOption := float64(totalIndex)*kilowatt.KiloWattHourBasePrice + baseSubscription

	for percent := 0; percent <= 100; percent += 2 {
		indexHC := totalIndex * percent / 100
		indexHP := totalIndex - indexHC

		priceHC := float64(indexHC) * kilowatt.KiloWattHourOffPeakPrice
		priceHP := float64(indexHP) * kilowatt.KiloWattHourFullHoursPrice

		totalPrice := priceHC + priceHP + offPeakHourSubscription

		if totalPrice <= totalPriceForBaseOption {
			return percent
		}
	}

	return 0
}
