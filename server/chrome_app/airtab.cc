/// @file airtab.cc
/// This example demonstrates loading, running and scripting a very simple NaCl
/// module.  To load the NaCl module, the browser first looks for the
/// CreateModule() factory method (at the end of this file).  It calls
/// CreateModule() once to load the module code from your .nexe.  After the
/// .nexe code is loaded, CreateModule() is not called again.
///
/// Once the .nexe code is loaded, the browser than calls the CreateInstance()
/// method on the object returned by CreateModule().  It calls CreateInstance()
/// each time it encounters an <embed> tag that references your NaCl module.
///
/// The browser can talk to your NaCl module via the postMessage() Javascript
/// function.  When you call postMessage() on your NaCl module from the browser,
/// this becomes a call to the HandleMessage() method of your pp::Instance
/// subclass.  You can send messages back to the browser by calling the
/// PostMessage() method on your pp::Instance.  Note that these two methods
/// (postMessage() in Javascript and PostMessage() in C++) are asynchronous.
/// This means they return immediately - there is no waiting for the message
/// to be handled.  This has implications in your program design, particularly
/// when mutating property values that are exposed to both the browser and the
/// NaCl module.

#include <cstdio>
#include <sstream>
#include <string>
#include "ppapi/c/ppb_fullscreen.h"
#include "ppapi/c/ppb_input_event.h"
#include "ppapi/cpp/completion_callback.h"
#include "ppapi/cpp/fullscreen.h"
#include "ppapi/cpp/input_event.h"
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/mouse_lock.h"
#include "ppapi/cpp/point.h"
#include "ppapi/cpp/var.h"

/// The Instance class.  One of these exists for each instance of your NaCl
/// module on the web page.  The browser will ask the Module object to create
/// a new Instance for each occurence of the <embed> tag that has these
/// attributes:
///     type="application/x-nacl"
///     src="airtab.nmf"
/// To communicate with the browser, you must override HandleMessage() for
/// receiving messages from the borwser, and use PostMessage() to send messages
/// back to the browser.  Note that this interface is entirely asynchronous.
class AirtabInstance : public pp::Instance, public pp::MouseLock {
 public:
  /// The constructor creates the plugin-side instance.
  /// @param[in] instance the handle to the browser-side plugin instance.
  explicit AirtabInstance(PP_Instance instance) :
    pp::Instance(instance),
    pp::MouseLock(this),
    width(0),
    height(0),
    mouselocked(false),
    callback_factory(this),
    fullscreen(this)
  {
  }
  virtual ~AirtabInstance() {}

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]) {
    int32_t code = RequestInputEvents(PP_INPUTEVENT_CLASS_MOUSE);
    int32_t code2 = RequestFilteringInputEvents(PP_INPUTEVENT_CLASS_WHEEL |
        PP_INPUTEVENT_CLASS_KEYBOARD);
    switch(code2) {
      case PP_OK:
        PostMessage("Bind to events successful");
        break;
      case PP_ERROR_BADARGUMENT:
        PostMessage("Invalid instance while trying to bind to events");
        break;
      case PP_ERROR_NOTSUPPORTED:
        PostMessage("Illegal event bits");
        break;
    }

    return true;
  }

  /// Handler for messages coming in from the browser via postMessage().  The
  /// @a var_message can contain anything: a JSON string; a string that encodes
  /// method names and arguments; etc.  For example, you could use
  /// JSON.stringify in the browser to create a message that contains a method
  /// name and some parameters, something like this:
  ///   var json_message = JSON.stringify({ "myMethod" : "3.14159" });
  ///   nacl_module.postMessage(json_message);
  /// On receipt of this message in @a var_message, you could parse the JSON to
  /// retrieve the method name, match it to a function call, and then call it
  /// with the parameter.
  /// @param[in] var_message The message posted by the browser.
  virtual void HandleMessage(const pp::Var& var_message) {
    if (var_message == "cmd:fullscreen") {
      if (this->fullscreen.SetFullscreen(true)) {
        PostMessage("entered fullscreen");
      }

      LockMouse(callback_factory.NewRequiredCallback(
        &AirtabInstance::DidLockMouse));
      PostMessage("lock mouse");
    }
  }

  virtual const std::string MouseButtonString(PP_InputEvent_MouseButton button) {
    switch (button) {
      case PP_INPUTEVENT_MOUSEBUTTON_NONE:
        return "n";
      case PP_INPUTEVENT_MOUSEBUTTON_LEFT:
        return "l";
      case PP_INPUTEVENT_MOUSEBUTTON_MIDDLE:
        return "m";
      case PP_INPUTEVENT_MOUSEBUTTON_RIGHT:
        return "r";
      default:
        return "u";
    }
  }

  virtual bool HandleMouseEvent(const pp::MouseInputEvent& event,
                                const std::string& kind) {
    if (!mouselocked || kind != "mousemove") {
      return false;
    }

    std::ostringstream stream;
    stream << kind << ":"                                      // 0
           << MouseButtonString(event.GetButton()) << ":"      // 1
           << event.GetPosition().x() << ":"                   // 2
           << event.GetPosition().y() << ":"                   // 3
           << event.GetMovement().x() << ":"                   // 4
           << event.GetMovement().y() << ":"                   // 5
           << event.GetClickCount() << ":"                     // 6
           << event.GetTimeStamp();                            // 7

    PostMessage(stream.str());
    return true;
  }

  virtual bool HandleWheelEvent(const pp::WheelInputEvent& event) {
    return false;
    std::ostringstream stream;
    stream << "wheel" << ":"
         << event.GetDelta().x() << ":"
         << event.GetDelta().y() << ":"
         << event.GetTicks().x() << ":"
         << event.GetTicks().y();
    PostMessage(stream.str());
    return true;
  }

  virtual bool HandleKeyEvent(const pp::KeyboardInputEvent& event,
                              const std::string& kind) {
    PostMessage("key event");
    if (event.GetKeyCode() == 117) { // f6 toggles fullscreen.
      this->fullscreen.SetFullscreen(!this->fullscreen.IsFullscreen());
      PostMessage("entering fullscreen");
    }

    if (!this->mouselocked && this->fullscreen.IsFullscreen()) {
      LockMouse(callback_factory.NewRequiredCallback(
        &AirtabInstance::DidLockMouse));
      PostMessage("lock mouse");
    }

    std::ostringstream stream;
    stream << kind << ":"
           << event.GetKeyCode() << ":"
           << event.GetTimeStamp();
    PostMessage(stream.str());
    return true;
  }

  virtual bool HandleInputEvent(const pp::InputEvent& event) {
    switch (event.GetType()) {
      case PP_INPUTEVENT_TYPE_MOUSEDOWN:
        return HandleMouseEvent(pp::MouseInputEvent(event), "mousedown");
      case PP_INPUTEVENT_TYPE_MOUSEUP:
        return HandleMouseEvent(pp::MouseInputEvent(event), "mouseup");
      case PP_INPUTEVENT_TYPE_MOUSEMOVE:
        return HandleMouseEvent(pp::MouseInputEvent(event), "mousemove");
      case PP_INPUTEVENT_TYPE_WHEEL:
        return HandleWheelEvent(pp::WheelInputEvent(event));
      case PP_INPUTEVENT_TYPE_KEYDOWN:
        return HandleKeyEvent(pp::KeyboardInputEvent(event), "keydown");
      case PP_INPUTEVENT_TYPE_KEYUP:
        return HandleKeyEvent(pp::KeyboardInputEvent(event), "keyup");
      case PP_INPUTEVENT_TYPE_CONTEXTMENU:
        return HandleKeyEvent(pp::KeyboardInputEvent(event), "ctx");
      default:
        PostMessage("unknown:");
        PostMessage(event.GetType());
        return false;
    }
    return false;
  }

  virtual void MouseLockLost() {
    PostMessage(pp::Var("MouseLockLost"));
  }

  void DidLockMouse(int32_t result) {
    this->mouselocked = result == PP_OK;
    if (this->mouselocked) {
      PostMessage("Mouse locked");
    } else {
      PostMessage("Mouse lock failed");
    }
  }

 private:
  int width;
  int height;
  bool mouselocked;
  pp::Fullscreen fullscreen;
  pp::CompletionCallbackFactory<AirtabInstance> callback_factory;
};

/// The Module class.  The browser calls the CreateInstance() method to create
/// an instance of your NaCl module on the web page.  The browser creates a new
/// instance for each <embed> tag with type="application/x-nacl".
class AirtabModule : public pp::Module {
 public:
  AirtabModule() : pp::Module() {}
  virtual ~AirtabModule() {}

  /// Create and return a AirtabInstance object.
  /// @param[in] instance The browser-side instance.
  /// @return the plugin-side instance.
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new AirtabInstance(instance);
  }
};

namespace pp {
/// Factory function called by the browser when the module is first loaded.
/// The browser keeps a singleton of this module.  It calls the
/// CreateInstance() method on the object you return to make instances.  There
/// is one instance per <embed> tag on the page.  This is the main binding
/// point for your NaCl module with the browser.
Module* CreateModule() {
  return new AirtabModule();
}
}  // namespace pp
