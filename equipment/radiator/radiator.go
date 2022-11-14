package radiator

import (
	"goconso/equipment"
)

const DefaultOperatingHours = "always"

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

// A radiator is an equipement that warms a room.
type radiator struct {
	name           string
	power          int
	operatingHours string
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// NewRadiator returns a new Equipment.
func New() equipment.Equipment {
	return NewWithOperatingHours(DefaultOperatingHours)
}

// NewWithOperatingHours returns a new Equipment with given operating hours.
func NewWithOperatingHours(operatingHours string) equipment.Equipment {
	return &radiator{
		name:           "Radiateur",
		power:          2000,
		operatingHours: operatingHours,
	}
}

//------------------------------------------------------------------------------
// Functions
//------------------------------------------------------------------------------

// Name
func (c *radiator) Name() string {
	return c.name
}

// OperatingHours returns the operating hours.
func (c *radiator) OperatingHours() string {
	return c.operatingHours
}
