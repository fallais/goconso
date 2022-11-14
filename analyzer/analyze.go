package analyzer

import (
	"fmt"
	"log"

	"goconso/edf/subscription"
)

func Analyze(o string, index map[string]interface{}) {
	option, err := parseOption(o)
	if err != nil {
		log.Fatal("error", err)
	}

	fmt.Printf("# Votre option actuelle : %s", option)
	fmt.Println()
	fmt.Println("# Détails")

	var baseSummary *BaseSubscriptionSummary
	var dayNightSummary *DayNightSubscriptionSummary
	switch option {
	case subscription.BaseOption:
		// Calculate the two summaries
		baseSummary = sumUpBaseSubscription(index["total"].(int))

		fmt.Printf("Abonnement : %.2f €", baseSummary.Subscription)
		fmt.Println()
		fmt.Printf("Prix total : %.2f € (%d kWh)", baseSummary.Total, baseSummary.TotalIndex)
		fmt.Println()
		fmt.Printf("L'option `HC/HP` vaut pas le coup si la majorité de votre consommation se fait la nuit")
	case subscription.DayNightOption:
		dayNightSummary = sumUpDayNightSubscription(index["hc"].(int), index["hp"].(int))
		baseSummary = sumUpBaseSubscription(dayNightSummary.TotalIndex)

		fmt.Printf("## Prix des heures creuses : %.2f € (%d kWh)", dayNightSummary.PriceHC, index["hc"].(int))
		fmt.Println()
		fmt.Printf("## Prix des heures pleines : %.2f € (%d kWh)", dayNightSummary.PriceHP, index["hp"].(int))
		fmt.Println()
		fmt.Printf("## Abonnement : %.2f €", dayNightSummary.Subscription)
		fmt.Println()
		fmt.Printf("## Prix total : %.2f € (%d kWh)", dayNightSummary.Total, dayNightSummary.TotalIndex)
		fmt.Println()

		if baseSummary.Total >= dayNightSummary.Total {
			fmt.Printf("L'option `Base` ne vaut pas le coup, elle aurait couté %.2f€ (plus chère de %.2f€)", baseSummary.Total, baseSummary.Total-dayNightSummary.Total)
		} else {
			fmt.Printf("L'option `Base` vaut le coup, elle aurait couté %.2f€ (%.2f€ d'économies)", baseSummary.Total, baseSummary.Total-dayNightSummary.Total)
		}
	}
}
