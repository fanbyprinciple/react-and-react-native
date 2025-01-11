import * as React from 'react'

import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import { NativeBaseProvider } from 'native-base'
import theme from "../app/theme"

type Props = {
    children: React.ReactNode
}

export default function AppContainer(props: Props) {
    return (
        <NavigationIndependentTree>
            <NavigationContainer>
                <NativeBaseProvider theme={theme}>{props.children}</NativeBaseProvider>
            </NavigationContainer>
        </NavigationIndependentTree>
    )
}