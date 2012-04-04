#include <ctype.h>
#include <malloc/malloc.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ApplicationServices/ApplicationServices.h>

#define CMD_LEN 20
#define CMD_ARGLEN 20

typedef struct _Command {
    char cmd[CMD_LEN];
    char arg1[CMD_ARGLEN];
    char arg2[CMD_ARGLEN];
    char arg3[CMD_ARGLEN];
} Command;

/**
 * Get the next token of an input string.
 * @param input - The input string.
 * @param len - Length of the input string.
 * @param i - The current index of the input string.
 * @param buffer - Buffer to hold the token. May store a broken token if the buffer is not long enough.
 * @param buflen - Length of the buffer.
 * @return The index after the token. 
 */
int nextToken(char *input, size_t len, int i, char *buffer, size_t buflen);
void parseCommand(Command *cmd, char *input);
int readLine(char *buffer, size_t len);
bool execCommand(Command *cmd);
void mousemove(double x, double y);
void mousedown(char btn);
void mouseup(char btn);
void keyup(int keycode);
void keydown(int keycode);
void scrollX(double amount);
void scrollY(double amount);
CGPoint mousePos(void);
void screenshot(void);

size_t g_screenWidth, g_screenHeight;

int nextToken(char *input, size_t len, int i, char *buffer, size_t buflen) {
    int bufIndex = 0;
    while(i < len && isspace(input[i])) 
        i++;
    while (i < len && !isspace(input[i]) && bufIndex < buflen - 1)
        buffer[bufIndex++] = input[i++];
    
    buffer[bufIndex++] = '\0';
    return i;
}

void parseCommand(Command *cmd, char *input) {
    int i = 0;
    ssize_t len = strlen(input);
    i = nextToken(input, len, i, cmd->cmd, CMD_LEN);
    i = nextToken(input, len, i, cmd->arg1, CMD_ARGLEN);
    i = nextToken(input, len, i, cmd->arg2, CMD_ARGLEN);
    nextToken(input, len, i, cmd->arg3, CMD_ARGLEN);
}

bool execCommand(Command *cmd) {
    double x, y;
    int key;
    if (strcmp(cmd->cmd, "mm") == 0) {
        x = strtod(cmd->arg1, NULL);
        y = strtod(cmd->arg2, NULL);
        mousemove(x, y);
        return true;
    } else if (strcmp(cmd->cmd, "kd") == 0) {
        key = (int) strtol(cmd->arg1, NULL, 10);
        keydown(key);
    } else if (strcmp(cmd->cmd, "ku") == 0) {
        key = (int)strtol(cmd->arg1, NULL, 10);
        keyup(key);
    } else if (strcmp(cmd->cmd, "md") == 0) {
        mousedown(cmd->arg1[0]);
    } else if (strcmp(cmd->cmd, "mu") == 0) {
        mouseup(cmd->arg1[0]);
    } else if (strcmp(cmd->cmd, "sy") == 0) {
        scrollY(strtod(cmd->arg1, NULL));
    } else if (strcmp(cmd->cmd, "sx") == 0) {
        scrollX(strtod(cmd->arg1, NULL));
    }
    
    return false;
}

int readLine(char *buffer, size_t len) {
    int i = 0;
    char c;
    c = getchar();
    while (i < len - 1 && (c != '\n')) {
        buffer[i++] = c;
        c = getchar();
    }
           
    buffer[i++] = '\0';
    return i;
}

void mousemove(double x, double y) {
    CGEventRef event = CGEventCreateMouseEvent(NULL, kCGEventMouseMoved	, CGPointMake(x * g_screenWidth, y * g_screenHeight), (CGMouseButton)NULL);
    CGEventPost(kCGHIDEventTap, event);
    CFRelease(event);
}

void mousedown(char btn) {
    CGEventType eventType = NX_NULLEVENT;
    CGMouseButton button;
    switch (btn) {
        case 'l':
            eventType = kCGEventLeftMouseDown;
            button = kCGMouseButtonLeft;
            break;
        case 'r':
            eventType = kCGEventRightMouseDown;
            button = kCGMouseButtonRight;
            break;
        case 'm':
            eventType = kCGEventOtherMouseDown;
            button = kCGMouseButtonCenter;
        default:
            break;
    }
    
    if (eventType != kCGEventNull) {
        CGEventRef event = CGEventCreateMouseEvent(NULL, eventType, mousePos(), button);
        CGEventPost(kCGHIDEventTap, event);
        CFRelease(event);
    }
}

void mouseup(char btn) {
    CGEventType eventType;
    CGMouseButton button;
    switch (btn) {
        case 'l':
            eventType = kCGEventLeftMouseDown;
            button = kCGMouseButtonLeft;
            break;
        case 'r':
            eventType = kCGEventRightMouseDown;
            button = kCGMouseButtonRight;
            break;
        case 'm':
            eventType = kCGEventOtherMouseDown;
            button = kCGMouseButtonCenter;
            break;
        default:
            eventType = kCGEventNull;
            break;
    }
    
    if (eventType != kCGEventNull) {
        CGEventRef event = CGEventCreateMouseEvent(NULL, eventType, mousePos(), button);
        CGEventPost(kCGHIDEventTap, event);
        CFRelease(event);
    }
}

void scrollX(double amount) {
    CGEventRef event = CGEventCreateScrollWheelEvent(NULL, kCGEventMouseSubtypeDefault, 2, 0, amount);
    CGEventPost(kCGHIDEventTap, event);
    CFRelease(event);
}

void scrollY(double amount) {
    CGEventRef event = CGEventCreateScrollWheelEvent(NULL, kCGEventMouseSubtypeDefault, 1, amount);
    CGEventPost(kCGHIDEventTap, event);
    CFRelease(event);
}

void screenshot() {
    
}

CGPoint mousePos() {
    CGEventRef event = CGEventCreate(nil);
    CGPoint loc = CGEventGetLocation(event);
    CFRelease(event);
    return loc;
}

// TODO: map between browser keycodes and osx keycodes
// file:///System/Library/Frameworks/Carbon.framework/Versions/A/Frameworks/HIToolbox.framework/Versions/A/Headers/Events.h
void keydown(int keycode) {
    CGEventRef event = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)keycode, true);
    CGEventPost(kCGHIDEventTap, event);
    CFRelease(event);
}

void keyup(int keycode) {
    CGEventRef event = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)keycode, false);
    CGEventPost(kCGHIDEventTap, event);
    CFRelease(event);
}

int main (int argc, const char * argv[])
{
    Command cmd;
    char lineBuff[100];
    
    // http://developer.apple.com/library/mac/#documentation/GraphicsImaging/Reference/Quartz_Services_Ref/Reference/reference.html#//apple_ref/doc/uid/TP30001070
    g_screenWidth = CGDisplayPixelsWide(CGDisplayPrimaryDisplay(CGMainDisplayID()));
    g_screenHeight = CGDisplayPixelsHigh(CGDisplayPrimaryDisplay(CGMainDisplayID()));
    
    while (true) {
        readLine(lineBuff, 100);
        parseCommand(&cmd, lineBuff);
        execCommand(&cmd);
    }
    
    return 0;
}

