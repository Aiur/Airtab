﻿using System;
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
                        case "s":
                            // Get screen size
                            int screenW, screenH;

                            client.GetScreenSize(out screenW, out screenH);
                            Console.WriteLine("{0} {1}", screenW, screenH);
                            break;
                        case "clear":
                            // Reset all the current keys that are down

                            foreach (byte keyCode in keysDown)
                            {
                                client.KeyUp(keyCode);
                            }
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
