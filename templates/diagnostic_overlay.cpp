#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <cmath>

// ========================================================================
// MOCK DIAGNOSTIC OVERLAY
// This file is generated for offline educational debugging purposes ONLY.
// It reads from a mock JSON/text file instead of a live process.
// ========================================================================

struct Vector3 { float x, y, z; };
struct Vector2 { float x, y; };

struct MockEntity {
    int id;
    float health;
    Vector3 position;
    int team;
};

// Simple World to Screen mock function
bool WorldToScreen(const Vector3& world, Vector2& screen, int screenWidth, int screenHeight) {
    // Mock projection logic
    screen.x = (world.x / 1000.0f) * (screenWidth / 2) + (screenWidth / 2);
    screen.y = (world.y / 1000.0f) * (screenHeight / 2) + (screenHeight / 2);
    
    // Check if behind camera
    if (world.z < 0) return false;
    return true;
}

void DrawBox(const Vector2& pos, float health) {
    std::cout << "[OVERLAY] Draw Box at (" << pos.x << ", " << pos.y << ") | Health: " << health << std::endl;
}

int main(int argc, char** argv) {
    std::cout << "--- Starting Mock Diagnostic Overlay ---" << std::endl;

    // Generate mock data
    std::vector<MockEntity> mockEntities = {
        { 1, 100.0f, { 500.0f, 200.0f, 100.0f }, 1 },
        { 2, 75.5f, { -300.0f, 800.0f, 50.0f }, 2 },
        { 3, 10.0f, { 100.0f, -500.0f, 200.0f }, 2 }
    };

    int screenWidth = 1920;
    int screenHeight = 1080;

    std::cout << "Processing " << mockEntities.size() << " mock entities..." << std::endl;

    for (const auto& entity : mockEntities) {
        Vector2 screenPos;
        if (WorldToScreen(entity.position, screenPos, screenWidth, screenHeight)) {
            DrawBox(screenPos, entity.health);
        }
    }

    std::cout << "--- Overlay Loop Completed ---" << std::endl;
    return 0;
}
