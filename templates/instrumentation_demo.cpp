#include <iostream>
#include <string>

// Safe Research: Compile-time Instrumentation
// Demonstrates how to insert hooks and logs at compile time using macros,
// instead of runtime LD_PRELOAD or memory patching.

#define INSTRUMENT_FUNCTION_ENTER() std::cout << "[INSTRUMENT] Entering: " << __FUNCTION__ << " at line " << __LINE__ << "\n"
#define INSTRUMENT_FUNCTION_EXIT() std::cout << "[INSTRUMENT] Exiting: " << __FUNCTION__ << "\n"

class GameEngineMock {
public:
    void InitEngine() {
        INSTRUMENT_FUNCTION_ENTER();
        std::cout << "Engine initialized.\n";
        INSTRUMENT_FUNCTION_EXIT();
    }
    
    void LoadLevel(const std::string& levelName) {
        INSTRUMENT_FUNCTION_ENTER();
        std::cout << "Loading level: " << levelName << "\n";
        INSTRUMENT_FUNCTION_EXIT();
    }
    
    int CalculateDamage(int baseDamage, int armor) {
        INSTRUMENT_FUNCTION_ENTER();
        int finalDamage = baseDamage - (armor / 2);
        if (finalDamage < 0) finalDamage = 0;
        std::cout << "Damage calculated: " << finalDamage << "\n";
        INSTRUMENT_FUNCTION_EXIT();
        return finalDamage;
    }
};

int main() {
    std::cout << "--- Compile-time Instrumentation Demo ---\n";
    GameEngineMock engine;
    engine.InitEngine();
    engine.LoadLevel("Map_Desert");
    engine.CalculateDamage(50, 20);
    std::cout << "--- Demo Finished ---\n";
    return 0;
}
