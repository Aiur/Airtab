//
//  main.c
//  AirtabOSXInputServer
//
//  Created by Charles Ma on 4/3/12.
//  Copyright 2012 __MyCompanyName__. All rights reserved.
//

#include <ctype.h>
#include <malloc/malloc.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ApplicationServices/ApplicationServices.h>

#define CMD_LEN 20
#define CMD_ARGLEN 20

// Ineficient as fuck data structure for storing commands.
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
int nextToken(char *input, ssize_t len, int i, char *buffer, ssize_t buflen);
void parseCommand(Command *cmd, char *input);
int readLine(char *buffer, ssize_t len);
bool execCommand(Command *cmd);
void mousemove(double x, double y);
void keyup(int keycode);
void keydown(int keycode);


size_t g_screenWidth, g_screenHeight;

int nextToken(char *input, ssize_t len, int i, char *buffer, ssize_t buflen) {
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
    i = nextToken(input, len, i, cmd->arg3, CMD_ARGLEN);
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
    }
    return false;
}

int readLine(char *buffer, ssize_t len) {
    int i = 0;
    char c;
    c = getchar();
    while (i < len - 1 && (c != '\n' && c != '\r')) {
        buffer[i++] = c;
        c = getchar();
    }
           
    buffer[i++] = '\0';
    return i;
}

void mousemove(double x, double y) {
    CGEventRef event = CGEventCreateMouseEvent(NULL, NX_MOUSEMOVED, CGPointMake(x * g_screenWidth, y * g_screenHeight), (CGMouseButton)NULL);
    CGEventPost(kCGHIDEventTap, event);
}

// TODO: map between browser keycodes and osx keycodes
// file:///System/Library/Frameworks/Carbon.framework/Versions/A/Frameworks/HIToolbox.framework/Versions/A/Headers/Events.h
void keydown(int keycode) {
    CGEventRef event = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)keycode, true);
    CGEventPost(kCGHIDEventTap, event);
}

void keyup(int keycode) {
    CGEventRef event = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)keycode, false);
    CGEventPost(kCGHIDEventTap, event);
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
        printf("%s\n", lineBuff);
    }
    
    return 0;
}

