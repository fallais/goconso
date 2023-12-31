package analyzer

import (
	"fmt"

	"goconso/internal/equipment"
	"goconso/pkg/edf"
	"goconso/pkg/edf/subscriptions"
	"goconso/pkg/edf/subscriptions/base"
	"goconso/pkg/edf/subscriptions/offpeak"
)

func Analyze(o string, index map[string]interface{}, p int) {
	fmt.Printf("# Votre option actuelle : %s", o)
	fmt.Println()
	fmt.Printf("# Votre puissance actuelle : %dkVA", p)
	fmt.Println()
	fmt.Println("# Détails")

	var baseSummary *subscriptions.Summary
	var dayNightSummary *subscriptions.Summary
	switch o {
	case "base":
		baseSubscription := base.New(edf.Power(p), index["total"].(int))

		// Calculate the two summaries
		baseSummary = baseSubscription.CalculateSummary()

		fmt.Printf("Abonnement : %.2f €", baseSummary.Subscription)
		fmt.Println()
		fmt.Printf("Prix total : %.2f € (%d kWh)", baseSummary.Total, baseSummary.Index)
		fmt.Println()
		fmt.Println()
		fmt.Println("# Conclusion")
		fmt.Printf("L'option `HC/HP` vaut pas le coup si la majorité de votre consommation se fait la nuit")
	case "heures_creuses":
		// Get the indexes
		hcIndex := index["heures_creuses"].(int)
		hpIndex := index["heures_pleines"].(int)

		offPeakSubscription := offpeak.New(edf.Power(p), hcIndex, hpIndex)
		baseSubscription := base.New(edf.Power(p), hcIndex+hpIndex)

		// Calculate the two summaries
		dayNightSummary = offPeakSubscription.CalculateSummary()
		baseSummary = baseSubscription.CalculateSummary()

		fmt.Printf("## Prix des heures creuses : %.2f € (%d kWh)", dayNightSummary.PriceHC, hcIndex)
		fmt.Println()
		fmt.Printf("## Prix des heures pleines : %.2f € (%d kWh)", dayNightSummary.PriceHP, hpIndex)
		fmt.Println()
		fmt.Printf("## Abonnement : %.2f €", dayNightSummary.Subscription)
		fmt.Println()
		fmt.Printf("## Prix total : %.2f € (%d kWh)", dayNightSummary.Total, dayNightSummary.Index)
		fmt.Println()
		fmt.Println()
		fmt.Println("# Conclusion")

		if baseSummary.Total >= dayNightSummary.Total {
			fmt.Printf("L'option `Base` ne vaut pas le coup, elle aurait couté %.2f€ (plus chère de %.2f€)", baseSummary.Total, baseSummary.Total-dayNightSummary.Total)
		} else {
			fmt.Printf("L'option `Base` vaut le coup, elle aurait couté %.2f€ (%.2f€ d'économies)", baseSummary.Total, baseSummary.Total-dayNightSummary.Total)
		}

		percentHC := dayNightSummary.IndexHC * 100 / dayNightSummary.Index
		percentHP := dayNightSummary.IndexHP * 100 / dayNightSummary.Index
		fmt.Println()
		fmt.Printf("Les heures creuses représentent %d%% de la consommation. Les heures pleines représentent %d%% de la consommation", percentHC, percentHP)
		fmt.Println()
		//fmt.Printf("Le seuil de rantabilité est : %d%%", calculateBreakEven(dayNightSummary.Index, p))
	}
}

func AnalyzeEquipments(equipments []equipment.Equipment) {
	fmt.Println("Total d'équipements :", len(equipments))

	totalRunningDay := 0
	totalRunningNight := 0

	for _, equipment := range equipments {
		switch equipment.OperatingHours() {
		case "day":
			totalRunningDay++
		case "night":
			totalRunningNight++
		case "always":
			totalRunningDay++
			totalRunningNight++
		}
	}

	if totalRunningDay > totalRunningNight {
		fmt.Println("Vos équipements fonctionnent plutot le jour")
	}
	if totalRunningDay < totalRunningNight {
		fmt.Println("Vos équipements fonctionnent plutot la nuit")
	}
	if totalRunningDay == totalRunningNight {
		fmt.Println("Vos équipements fonctionnent aussi bien le jour que la nuit")
	}
}
