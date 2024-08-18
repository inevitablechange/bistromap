import { extendTheme } from "@chakra-ui/react";
import "@fontsource/plus-jakarta-sans"; // 설치한 폰트를 import

// Import the weights and subsets, add any other config here as well
const colors = {
  primary: "#F3CD00",
  gray: {
    200: "#D3DCE7",
    300: "#BDBDBD",
    800: "#484542",
    900: "#1A202C",
  },
  lightGreen: "#ABC73D59",
  chocolate: {
    light: "#59412F",
    dark: "#2F1B0C",
  },
  indigoNight: "#486284",
  yellow: {
    100: "#FCFAE7",
    200: "#FFFDD0",
    300: "#FFF69D",
    400: "#F3CD00",
    neutral: "#ECECE0",
  },
  cream: "#FAF9F6",
};

// 확장된 테마 생성
const theme = extendTheme({
  colors,
  fonts: {
    heading: `'Plus Jakarta Sans', sans-serif`,
    body: `'Plus Jakarta Sans', sans-serif`,
  },
  components: {
    Button: {
      variants: {
        solid: (props: any) => ({
          bg:
            props.colorScheme === "chocolate.light"
              ? "chocolate.light"
              : props.colorScheme === "yellow.400"
              ? "yellow.400"
              : "transparent",
        }),
      },
    },
  },
});

export default theme;
