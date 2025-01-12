import * as React from 'react'

import {
    Text, Box, Center, VStack, themeTools, useColorModeValue
} from 'native-base';

import ThemeToggle from '@/components/theme-toggle';

import AnimatedCheckbox from '@/components/animated-checkbox';

export default function  MainScreen(){
    return (
        <Center px={4} flex={1}>
            <VStack space={5} alignItems="center" bg={useColorModeValue('blue.500', 'green.500')}>
                <Box w="50px" h="50px">
                    <AnimatedCheckbox />
                </Box>
                <Box p={50} bg={useColorModeValue('red.500', 'yellow.500')} width={40} alignItems="center">
                    <Text>Hello</Text>
                </Box>
                <ThemeToggle />
               
            </VStack>
        </Center>  
    )
} 