import Home from "./views/Home.jsx";
import Display from "./views/Display.jsx";

// 编写路由表 
export const routes = [
    {
        path: "/",
        element: <Home/>,
    },
    {
        path: "/home",
        element: <Home/>,
    },    
    {
        path: "/display",
        element: <Display />,
    },
];