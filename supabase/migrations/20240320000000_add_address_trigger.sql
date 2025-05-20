-- Create a function to format the address
CREATE OR REPLACE FUNCTION format_employee_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update the address field if at least one of the address components is not null
    IF NEW.address_line1 IS NOT NULL OR NEW.city IS NOT NULL OR NEW.state IS NOT NULL OR NEW.zip IS NOT NULL THEN
        -- Format the address with proper spacing and commas
        NEW.address := TRIM(
            CONCAT_WS(', ',
                NULLIF(NEW.address_line1, ''),
                NULLIF(NEW.address_line2, ''),
                CONCAT_WS(' ',
                    NULLIF(NEW.city, ''),
                    NULLIF(NEW.state, ''),
                    NULLIF(NEW.zip, '')
                )
            )
        );
    ELSE
        -- If all address components are null, keep the address field as null
        NEW.address := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the address field
DROP TRIGGER IF EXISTS update_employee_address ON employees;
CREATE TRIGGER update_employee_address
    BEFORE INSERT OR UPDATE OF address_line1, address_line2, city, state, zip
    ON employees
    FOR EACH ROW
    EXECUTE FUNCTION format_employee_address();

-- Add a comment to explain the trigger
COMMENT ON TRIGGER update_employee_address ON employees IS 
    'Automatically formats and updates the address field whenever address components change. 
     The address field will be NULL by default and will only be populated when address components are present.'; 