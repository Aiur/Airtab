using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace AirTabInputServer
{
    public class Win32InputClient : InputClient
    {
        [Flags]
        public enum MouseEventFlags
        {
            LeftDown = 0x00000002,
            LeftUp = 0x00000004,
            MiddleDown = 0x00000020,
            MiddleUp = 0x00000040,
            Move = 0x00000001,
            Absolute = 0x00008000,
            RightDown = 0x00000008,
            RightUp = 0x00000010,
            VWheel = 0x800,
            HWheel = 0x1000
        }

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetCursorPos(out MousePoint lpMousePoint);

        [DllImport("user32", SetLastError = true)]
        private static extern int SetCursorPos(int x, int y);

        [DllImport("user32.dll")]
        private static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);

        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags,
           int dwExtraInfo);

        [DllImport("user32.dll")]
        static extern int GetSystemMetrics(SystemMetric smIndex);

        public enum SystemMetric
        {
            SM_CXSCREEN = 0,
            SM_CYSCREEN = 1,
        }

        const int KEYEVENTF_EXTENDEDKEY = 0x1;
        const int KEYEVENTF_KEYUP = 0x2;

        [StructLayout(LayoutKind.Sequential)]
        public struct MousePoint
        {
            public int X;
            public int Y;

            public MousePoint(int x, int y)
            {
                X = x;
                Y = x;
            }
        }

        private static MousePoint GetCursorPosition()
        {
            MousePoint currentMousePoint;
            var gotPoint = GetCursorPos(out currentMousePoint);
            if (!gotPoint) { currentMousePoint = new MousePoint(0, 0); }
            return currentMousePoint;
        }

        public void MouseMove(int x, int y)
        {
            SetCursorPos(x, y);
        }

        public void MouseClick(MouseButton button)
        {
            MouseDown(button);
            MouseUp(button);
        }

        public void MouseDown(MouseButton button)
        {
            MousePoint point;
            if (!GetCursorPos(out point))
            {
                throw new InvalidOperationException("Could not get mouse position");
            }

            mouse_event
                ((int)(button == MouseButton.Left ? MouseEventFlags.LeftDown : 
                    button == MouseButton.Middle ? MouseEventFlags.MiddleDown : MouseEventFlags.RightDown),
                point.X, point.Y, 0, 0);
        }

        public void MouseUp(MouseButton button)
        {
            MousePoint point;
            if (!GetCursorPos(out point))
            {
                throw new InvalidOperationException("Could not get mouse position");
            }

            mouse_event
                ((int)(button == MouseButton.Left ? MouseEventFlags.LeftUp :
                    button == MouseButton.Middle ? MouseEventFlags.MiddleUp : MouseEventFlags.RightUp),
                point.X, point.Y, 0, 0);
        }

        public void MouseScroll(int scrollDelta, bool isHorizontal)
        {
            mouse_event((int)(isHorizontal ? MouseEventFlags.HWheel : MouseEventFlags.VWheel), 0, 0, scrollDelta, 0);
        }

        public void KeyDown(byte keycode)
        {
            keybd_event(keycode, 0x45, KEYEVENTF_EXTENDEDKEY, 0);
        }

        public void KeyUp(byte keycode)
        {
            keybd_event(keycode, 0x45, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
        }

        public void GetScreenSize(out int width, out int height)
        {
            width = GetSystemMetrics(SystemMetric.SM_CXSCREEN);
            height = GetSystemMetrics(SystemMetric.SM_CYSCREEN);
        }
    }
}
