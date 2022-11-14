package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"log"

	"goconso/edf/kilowatt"
	"goconso/edf/subscription"
	"goconso/equipment"
	"goconso/equipment/basic"
	"goconso/equipment/fridge"
	"goconso/equipment/radiator"

	"github.com/spf13/viper"
)

func main() {
	configFilePtr := flag.String("c", "ma_conso.yml", "Feuille de consommation")

	// Parse the flags
	flag.Parse()

	// Read configuration file
	data, err := ioutil.ReadFile(*configFilePtr)
	if err != nil {
		log.Fatal("error while reading configuration file", err)
	}

	// Initialize configuration values with Viper
	viper.SetConfigType("yaml")
	err = viper.ReadConfig(bytes.NewBuffer(data))
	if err != nil {
		log.Fatal("error when reading configuration file", err)
	}

	sumUpDayNightSubscription(viper.GetInt("index.hc"), viper.GetInt("index.hp"))
	fmt.Println()
	sumUpBaseSubscription(viper.GetInt("index.hc") + viper.GetInt("index.hp"))

	equipements := []equipment.Equipment{
		basic.NewBasicEquipment("Serveur NAS", 200, "always"),
		basic.NewBasicEquipment("Machine à laver", 2000, "night"),
		basic.NewBasicEquipment("Lave-vaisselle", 2000, "night"),
		fridge.New(),
		fridge.New(),
		radiator.New(),
		radiator.New(),
		radiator.New(),
		radiator.New(),
	}
	fmt.Println("Total d'équipements :", len(equipements))
}

func sumUpDayNightSubscription(indexHC, indexHP int) {
	totalIndex := indexHC + indexHP
	subscription := subscription.PerYearSubscription(subscription.DayNightOption, subscription.Power12kVA)
	priceHC := float64(indexHC) * kilowatt.KiloWattHourOffPeakPrice
	priceHP := float64(indexHP) * kilowatt.KiloWattHourFullHoursPrice
	priceTotal := priceHC + priceHP + subscription

	fmt.Println("# En option `HV/HP`")
	fmt.Printf("Heures creuses : %.2f € (%d kWh)", priceHC, indexHC)
	fmt.Println()
	fmt.Printf("Heures pleines : %.2f € (%d kWh)", priceHP, indexHP)
	fmt.Println()
	fmt.Printf("Abonnement : %.2f €", subscription)
	fmt.Println()
	fmt.Printf("Consommation totale : %.2f € (%d kWh)", priceTotal, totalIndex)
	fmt.Println()
}

func sumUpBaseSubscription(index int) {
	totalIndex := index
	subscription := subscription.PerYearSubscription(subscription.BaseOption, subscription.Power12kVA)
	priceTotal := float64(index)*kilowatt.KiloWattHourBasePrice + subscription

	fmt.Println("# En option `Base`")
	fmt.Printf("Abonnement : %.2f €", subscription)
	fmt.Println()
	fmt.Printf("Consommation totale : %.2f € (%d kWh)", priceTotal, totalIndex)
	fmt.Println()
}
