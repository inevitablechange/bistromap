import { extendTheme, HTMLChakraProps, ThemingProps } from "@chakra-ui/react";

import { globalStyles } from "./styles";

export default extendTheme(globalStyles);

export interface CustomCardProps extends HTMLChakraProps<"div">, ThemingProps {}
