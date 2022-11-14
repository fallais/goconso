package main

import (
	"bytes"
	"flag"
	"fmt"
	"log"
	"os"

	"goconso/analyzer"
	"goconso/equipment"
	"goconso/equipment/fridge"
	"goconso/equipment/generic"
	"goconso/equipment/hotwatertank"
	"goconso/equipment/radiator"

	"github.com/spf13/viper"
)

func main() {
	configFilePtr := flag.String("c", "ma_conso.yml", "Feuille de consommation")

	// Parse the flags
	flag.Parse()

	// Read configuration file
	data, err := os.ReadFile(*configFilePtr)
	if err != nil {
		log.Fatal("error while reading configuration file", err)
	}

	// Initialize configuration values with Viper
	viper.SetConfigType("yaml")
	err = viper.ReadConfig(bytes.NewBuffer(data))
	if err != nil {
		log.Fatal("error when reading configuration file", err)
	}

	// Analyze the subscription
	analyzer.Analyze(viper.GetString("option"), viper.GetStringMap("index"), viper.GetInt("puissance"))

	// Analyze the equipments
	fmt.Println()
	fmt.Println()
	equipments := []equipment.Equipment{
		generic.New("Serveur NAS", 200, "always"),
		generic.New("Machine à laver", 2000, "night"),
		generic.New("Lave-vaisselle", 2000, "night"),
		generic.New("Four", 2500, "day"),
		fridge.New(),
		fridge.New(),
		fridge.New(),
		radiator.New(),
		radiator.New(),
		radiator.New(),
		radiator.New(),
		hotwatertank.New(),
		generic.New("Ordinateur 1", 100, "day"),
		generic.New("Ordinateur 2", 100, "day"),
		generic.New("Ordinateur 3", 100, "day"),
		generic.New("Livebox", 10, "always"),
		generic.New("Lumières de la maison", 30*10, "day"),
	}
	analyzer.AnalyzeEquipments(equipments)
}
