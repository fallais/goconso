package analyzer

/* func calculateBreakEven(totalIndex int, power subscription.Power) int {
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
} */
