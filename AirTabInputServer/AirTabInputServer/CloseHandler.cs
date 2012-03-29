﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace AirTabInputServer
{
    public class CloseHandler
    {
        private static Action s_handler = null;
        public static void SetCloseHandler(Action handler)
        {
            SetConsoleCtrlHandler(new HandlerRoutine(ConsoleCtrlCheck), true);
            s_handler = handler;
        }
 
        private static bool ConsoleCtrlCheck(CtrlTypes ctrlType)
        {
            s_handler();
            return false;
        }
 
        #region unmanaged
        // Declare the SetConsoleCtrlHandler function
        // as external and receiving a delegate.
 
        [DllImport("Kernel32")]
        public static extern bool SetConsoleCtrlHandler(HandlerRoutine Handler, bool Add);
 
        // A delegate type to be used as the handler routine
        // for SetConsoleCtrlHandler.
        public delegate bool HandlerRoutine(CtrlTypes CtrlType);
 
        // An enumerated type for the control messages
        // sent to the handler routine.
        public enum CtrlTypes
        {
            CTRL_C_EVENT = 0,
            CTRL_BREAK_EVENT,
            CTRL_CLOSE_EVENT,
            CTRL_LOGOFF_EVENT = 5,
            CTRL_SHUTDOWN_EVENT
        }
 
        #endregion
 
    
    }
}
