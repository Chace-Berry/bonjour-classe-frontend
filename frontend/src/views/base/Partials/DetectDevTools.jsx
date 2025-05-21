///import { useEffect } from "react";

//function DetectDevTools() {
  //useEffect(() => {
    //let devToolsOpen = false;

   // const handleDevToolsOpen = () => {
    //  if (!devToolsOpen) {
      //  devToolsOpen = true; // Prevent multiple redirects
       // alert("Developer tools are disabled on this page.");
       // const redirectUrl =
      //    "https://t4.ftcdn.net/jpg/03/63/21/35/360_F_363213534_oMwiB3fpnpWrMBLZeT5Za7JfPWyApvmU.jpg";
      //  window.open(
        ///  redirectUrl,
      // //   "_blank",
       //   "fullscreen=yes,toolbar=no,menubar=no,scrollbars=no,resizable=no,status=no"
     //   );
     //   window.location.href = redirectUrl; // Redirect the current page as well
   //   }
   // };

   // const detectDevTools = () => {
    //  const devtools = /./;
   //   devtools.toString = () => "devtools";
    //  if (devtools.toString() === "devtools") {
    //    handleDevToolsOpen();
   //   }
  //  };

    // Periodically check for dev tools
  //  const devToolsInterval = setInterval(detectDevTools, 1000);

    // Cleanup interval on unmount
  //  return () => {
   //   clearInterval(devToolsInterval);
  //  };
 // }, []);

 //// return null; // This component doesn't render anything
//}

//export default DetectDevTools;