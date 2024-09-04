import PropTypes from 'prop-types'
import React from 'react'
import { SharedStateContext, useSharedState } from './utils.js'

const SetupStateProvider = ({children}) => {
  const sharedState = useSharedState()

  return (
      <SharedStateContext.Provider value={sharedState}>
        {children}
      </SharedStateContext.Provider>
  )
}

SetupStateProvider.propTypes = {
  children: PropTypes.node,
}

export default SetupStateProvider
