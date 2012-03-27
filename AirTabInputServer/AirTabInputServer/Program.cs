using System;
using System.Collections.Generic;
using System.Threading;

namespace AirTabInputServer
{
    class Program
    {
        static List<string> s_events = new List<string>();
        const int MAX_EVENTS_HISTORY = 1000;

        static void Main(string[] args)
        {
            try
            {
                InputClient client = new Win32InputClient();
                InputServer(client);
            }
            catch (Exception ex)
            {

                System.IO.File.WriteAllText("serverCrash.txt", ex.ToString());
                throw;
            }
        }

        static void InputServer(InputClient client)
        {
            Console.Error.WriteLine("Start input server");
            HashSet<byte> keysDown = new HashSet<byte>();

            CloseHandler.SetCloseHandler(() =>
            {
                System.IO.File.WriteAllText("serverCloseLog.txt", "Server closing, resetting keys:\r\n");
                foreach (byte keycode in keysDown)
                {
                    client.KeyUp(keycode);
                    System.IO.File.AppendAllText("serverCloseLog.txt", "KeyCode: " + keycode + "\r\n");
                }

                client.MouseUp(MouseButton.Left);
                client.MouseUp(MouseButton.Right);
                client.MouseUp(MouseButton.Middle);
            });

            // we work on a line by line basis
            string line;
            while ((line = Console.ReadLine()) != null)
            {
                // we can process multiple commands in a single line separated by ;
                foreach (string linePart in line.Split(new char[]{';'}, StringSplitOptions.RemoveEmptyEntries))
                {
                    // Add to history
                    s_events.Add(linePart);
                    while (s_events.Count > MAX_EVENTS_HISTORY) s_events.RemoveAt(0);

                    // split by space
                    string[] parts = linePart.Split(new char[]{' '}, StringSplitOptions.RemoveEmptyEntries);

                    switch (parts[0])
                    {
                        case "mm":
                            // Mouse move
                            // x = parts[1], y = parts[2]
                            double x = double.Parse(parts[1]);
                            double y = double.Parse(parts[2]);
                            int width, height;
                            client.GetScreenSize(out width, out height);

                            int xPixel = (int)(x * width);
                            int yPixel = (int)(y * height);

                            if (xPixel > width) xPixel = width;
                            if (yPixel > height) yPixel = height;

                            client.MouseMove(xPixel, yPixel);
                            break;
                        case "mmr":
                            // Relative mouse move
                            // x change = parts[1], y change = parts[2]

                            int xDiff = int.Parse(parts[1]);
                            int yDiff = int.Parse(parts[2]);

                            client.MouseMoveRelative(xDiff, yDiff);
                            break;
                        case "m":
                        case "md":
                        case "mu":
                            // Mouse click
                            // clickType == parts[1], l = left, m = middle, r = right

                            MouseButton btn = MouseButton.Left;
                            if (parts[1] == "m") {
                                btn = MouseButton.Middle;
                            }
                            else if (parts[1] == "r") 
                            {
                                btn = MouseButton.Right;
                            }

                            if (parts[0] == "m")
                            {
                                client.MouseClick(btn);
                            }
                            else if (parts[0] == "md")
                            {
                                client.MouseDown(btn);
                            }
                            else if (parts[0] == "mu")
                            {
                                client.MouseUp(btn);
                            }
                            else
                            {
                                throw new Exception("Forgot to update some strings somewhere?");
                            }

                            break;
                        case "k":
                        case "kd":
                        case "ku":
                            // Keyboard button
                            byte keycode = byte.Parse(parts[1]);

                            if (parts[0] == "k")
                            {
                                client.KeyDown(keycode);
                                client.KeyUp(keycode);
                            }
                            else if (parts[0] == "kd")
                            {
                                keysDown.Add(keycode);
                                client.KeyDown(keycode);
                            }
                            else if (parts[0] == "ku")
                            {
                                if (keysDown.Contains(keycode)) keysDown.Remove(keycode);
                                client.KeyUp(keycode);
                            }
                            else
                            {
                                throw new Exception("Forgot to update some strings somewhere?");
                            }

                            break;
                        case "sy":
                        case "sx":
                            int scrollDelta = (int)(double.Parse(parts[1]) * 120);
                            client.MouseScroll(scrollDelta, parts[0] == "sx");
                            break;
                        case "s":
                            // Get screen size
                            int screenW, screenH;

                            client.GetScreenSize(out screenW, out screenH);
                            Console.WriteLine("{0} {1}", screenW, screenH);
                            break;
                        case "ss":
                            // Take screenshot - dir to save is first param, returns file saved (including dir name)
                            // image width/height are 2nd and 3rd params, anything <= 0 means ignore it and use native res
                            int sWidth = int.Parse(parts[2]);
                            int sHeight = int.Parse(parts[3]);

                            ThreadPool.QueueUserWorkItem(o =>
                            {
                                string filename = client.Screenshot(parts[1], sWidth, sHeight);
                                Console.WriteLine("==screenshot==");
                                Console.WriteLine(filename);
                                Console.WriteLine("<><>");
                            });
                            break;
                        case "clear":
                            // Reset all the current keys that are down

                            foreach (byte keyCode in keysDown)
                            {
                                client.KeyUp(keyCode);
                            }
                            keysDown.Clear();
                            break;
                        case "debug":
                            // start of output
                            Console.WriteLine("==debug==");
                            Console.WriteLine("Event History:");
                            foreach (string e in s_events)
                            {
                                Console.WriteLine(" " + e);
                            }

                            Console.WriteLine("Key Downs:");
                            foreach (byte k in keysDown)
                            {
                                Console.WriteLine(" " + k);
                            }
                            
                            // end of output
                            Console.WriteLine("<><>");
                            break;
                        default:
                            throw new InvalidOperationException("Protocol Violation");
                    }
                }
            }
            Console.Error.WriteLine("Input server closed");
        }
    }
}
