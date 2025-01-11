import * as React from 'react'

import {
    Text, Box, Center, VStack, themeTools, useColorModeValue
} from 'native-base';

import ThemeToggle from '@/components/theme-toggle';

export default function  MainScreen(){
    return (
        <Center _dark={{bg: 'blueGray.900'}} _light={{bg: 'blueGray.50'}} px={4} flex={1}>
            <VStack space={5} alignItems="center" bg={useColorModeValue('blue.500', 'green.500')}>
                <Box p={50} bg={useColorModeValue('red.500', 'yellow.500')} width={40} alignItems="center">
                    <Text>Hello</Text>
                </Box>
                <ThemeToggle />
               
            </VStack>
        </Center>  
    )
} 