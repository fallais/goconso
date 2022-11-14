package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"log"

	"goconso/analyzer"
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

	analyzer.Analyze(viper.GetString("option"), viper.GetStringMap("index"), viper.GetInt("puissance"))

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

	fmt.Println()
	fmt.Println()
	fmt.Println("Total d'équipements :", len(equipements))
}
