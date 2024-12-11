import { Tooltip } from '@dhis2-ui/tooltip'
import PropTypes from 'prop-types';
import classes from '../App.module.css'

const TooltipComponent = (
    {
        IconType = IconType,
        btnFunc = btnFunc,
        conditionID = conditionID,
        dynamicText = dynamicText,
        buttonMode,
        customIcon,
        disabled = disabled
    }
) => {

    return (


        <span
            onClick={() => btnFunc(conditionID)}
            className={
                `${classes.buttonRight} 
                                    ${classes.iconButton} 
                                    ${classes.tooltipbutton}
                                    `
            }
            disabled={disabled}
            style={{display: 'flex', alignItems: 'center', padding: '0', marginLeft: '8px', cursor: 'pointer'}}>
                    {/* Conditionally render based on customIcon */}
            <Tooltip content={dynamicText}>
                        <IconType className={classes.icon}/>
                    </Tooltip>
            </span>

    );

};

TooltipComponent.propTypes = {
    IconType: PropTypes.elementType.isRequired,
    btnFunc: PropTypes.func.isRequired,
    buttonMode: PropTypes.string.isRequired,
    conditionID: PropTypes.any.isRequired,
    dynamicText: PropTypes.string.isRequired,
    customIcon: PropTypes.bool,
    disabled: PropTypes.bool

};

export default TooltipComponent;
