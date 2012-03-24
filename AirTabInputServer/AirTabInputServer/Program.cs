using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AirTabInputServer
{
    class Program
    {
        static void Main(string[] args)
        {
            InputClient client = new Win32InputClient();
            InputServer(client);
        }

        static void InputServer(InputClient client)
        {
            Console.WriteLine("Start input server");

            // we work on a line by line basis
            string line;
            while ((line = Console.ReadLine()) != null)
            {
                // we can process multiple commands in a single line separated by ;
                foreach (string linePart in line.Split(new char[]{';'}, StringSplitOptions.RemoveEmptyEntries))
                {
                    // split by space
                    string[] parts = linePart.Split(new char[]{' '}, StringSplitOptions.RemoveEmptyEntries);

                    switch (parts[0])
                    {
                        case "m":
                            // Mouse move
                            // x = parts[1], y = parts[2]
                            int x = int.Parse(parts[1]);
                            int y = int.Parse(parts[2]);

                            client.MouseMove(x, y);
                            break;
                        case "c":
                            // Mouse click
                            // clickType == parts[1], l = left, r = right
                            bool leftClick = (parts[1] == "l");

                            client.MouseClick(leftClick ? MouseButton.Left : MouseButton.Right);
                            break;
                        case "k":
                            // Keyboard button
                            byte keycode1 = byte.Parse(parts[1]);

                            client.KeyDown(keycode1);
                            client.KeyUp(keycode1);
                            break;
                        case "d":
                            // Keyboard button down
                            byte keycode2 = byte.Parse(parts[1]);

                            client.KeyDown(keycode2);
                            break;
                        case "u":
                            // Keyboard button down
                            byte keycode3 = byte.Parse(parts[1]);

                            client.KeyUp(keycode3);
                            break;
                        default:
                            throw new InvalidOperationException("Protocol Violation");
                    }
                }
            }
            Console.WriteLine("Input server closed");
        }
    }
}
