import { mode } from "@chakra-ui/theme-tools";

export const globalStyles = {
  config: {
    initialColorMode: "light",
    useSystemColorMode: false, // Optional: If you don't want to use the system's color mode preference
  },
  colors: {
    primary: "#F3CD00",
    gray: {
      300: "#BDBDBD",
      800: "#484542",
      900: "#1A202C",
    },
    chocolate: {
      light: "#59412F",
      dark: "#2F1B0C",
    },
    yellow: {
      200: "#FCFAE7",
      300: "FFF69D",
      400: "F3CD00",
      neutral: "ECECE0",
    },
    cream: "#FAF9F6",
  },
  initialColorMode: "dark",
  styles: {
    global: (props: any) => ({
      body: {
        overflowX: "hidden",
        bg: mode("transparent", "transparent")(props),
        fontFamily: "Plus Jakarta Sans",
        color: mode("gray.800", "gray.800")(props), // Changing font color based on color mode
      },
      input: {
        color: "gray.700",
      },
      html: {
        fontFamily: "Plus Jakarta Sans",
      },
    }),
  },
};
