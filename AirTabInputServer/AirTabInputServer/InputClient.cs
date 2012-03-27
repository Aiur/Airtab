using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AirTabInputServer
{
    public enum MouseButton
    {
        Left, Middle, Right
    };

    interface InputClient
    {
        void MouseMove(int x, int y);
        void MouseClick(MouseButton button);
        void KeyDown(byte keycode);
        void KeyUp(byte keycode);
        void GetScreenSize(out int width, out int height);
        void MouseDown(MouseButton button);
        void MouseUp(MouseButton button);
        void MouseScroll(int scrollDelta, bool isHorizontal);
        void MouseMoveRelative(int xDiff, int yDiff);

        // If width or height are -1, we don't use them
        string Screenshot(string dir, int width, int height);
    }
}
