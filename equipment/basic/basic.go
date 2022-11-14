package basic

import (
	"goconso/equipment"
)

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

// A basic equipement can be anything.
type basicEquipment struct {
	name           string
	power          int
	operatingHours string
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// NewBasicEquipment returns a new Equipment.
func NewBasicEquipment(name string, power int, operatingHours string) equipment.Equipment {
	return &basicEquipment{
		name:           name,
		power:          power,
		operatingHours: operatingHours,
	}
}

//------------------------------------------------------------------------------
// Functions
//------------------------------------------------------------------------------

// Name
func (c *basicEquipment) Name() string {
	return c.name
}

// OperatingHours returns the operating hours.
func (c *basicEquipment) OperatingHours() string {
	return c.operatingHours
}
