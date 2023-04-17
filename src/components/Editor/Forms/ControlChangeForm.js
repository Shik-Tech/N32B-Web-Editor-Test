import {
    Checkbox,
    FormControlLabel,
    Stack,
    TextField
} from "@mui/material";
import React from "react";

function ControlChangeForm({
    currentKnob,
    handleMSBChange,
    handleInvertValueAChange,
    handleMinAChange,
    handleMaxAChange
}) {
    const {
        msb,
        invert_a,
        min_a,
        max_a
    } = currentKnob;

    return (
        <Stack
            direction="column"
            spacing={2}
        >
            <Stack
                direction="row"
                spacing={2}
            >
                <TextField
                    fullWidth
                    size="small"
                    label="Control Number"
                    type="number"

                    InputProps={{ inputProps: { min: 0, max: 127 } }}
                    value={msb}
                    onChange={handleMSBChange}
                />
            </Stack>

            <Stack
                direction="row"
                spacing={2}
            >
                <TextField
                    fullWidth
                    size="small"
                    label="Min"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: max_a } }}
                    value={min_a}
                    onChange={handleMinAChange}
                />
                <TextField
                    fullWidth
                    size="small"
                    label="Max"
                    type="number"
                    InputProps={{ inputProps: { min: min_a, max: 127 } }}
                    value={max_a}
                    onChange={handleMaxAChange}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={invert_a}
                            onChange={handleInvertValueAChange}
                        />
                    }
                    label="Invert" />
            </Stack>
        </Stack>
    )
}

export default ControlChangeForm;