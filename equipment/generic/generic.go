package generic

import (
	"goconso/equipment"
)

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

// A generic equipement can be anything.
type genericEquipment struct {
	name           string
	power          int
	operatingHours string
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// New returns a new Equipment.
func New(name string, power int, operatingHours string) equipment.Equipment {
	return &genericEquipment{
		name:           name,
		power:          power,
		operatingHours: operatingHours,
	}
}

//------------------------------------------------------------------------------
// Functions
//------------------------------------------------------------------------------

// Name
func (c *genericEquipment) Name() string {
	return c.name
}

// OperatingHours returns the operating hours.
func (c *genericEquipment) OperatingHours() string {
	return c.operatingHours
}
