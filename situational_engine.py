"""
===============================================================================
MOTOR DE PROCESAMIENTO SITUACIONAL Y ONBOARDING PSICOMÉTRICO
Plataforma de No-Monogamia Ética (ENM) / Swinger Colombia
===============================================================================
Autor: Diseñador de Algoritmos Psicométricos & Desarrollador Backend Senior
Lenguaje: Python 3 (NumPy + Type Annotations)

Este módulo traduce las elecciones situacionales del usuario en el onboarding
hacia el vector de 5 dimensiones normalizado en [-1.0, 1.0], consolida los
límites duros (hard-vetoes) y calcula un índice escalar de Consistencia de Perfil.
Adicionalmente, genera los payloads optimizados para la persistencia directa en
Supabase / PostgreSQL con extensión pgvector.
===============================================================================
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any, Union
import json
import datetime
import numpy as np

# Importación de estructuras vectoriales del Sprint 1.1
try:
    from relational_compatibility import RelationalVector
except ImportError:
    @dataclass
    class RelationalVector:
        e1_relational_spectrum: float = 0.0
        e2_third_party_orientation: float = 0.0
        e3_power_dynamics: float = 0.0
        e4_emotional_attachment: float = 0.0
        e5_boundary_flexibility: float = 0.0

        def to_numpy(self) -> np.ndarray:
            return np.array([
                self.e1_relational_spectrum,
                self.e2_third_party_orientation,
                self.e3_power_dynamics,
                self.e4_emotional_attachment,
                self.e5_boundary_flexibility
            ], dtype=np.float64)


@dataclass
class ScenarioOption:
    """Representa una opción de respuesta dentro de un dilema situacional."""
    option_id: str
    text: str
    delta_vector: np.ndarray  # Impacto marginal [dE1, dE2, dE3, dE4, dE5]
    vetoes: Dict[str, bool] = field(default_factory=dict)
    practices: Dict[str, bool] = field(default_factory=dict)
    expected_polarity: np.ndarray = field(default_factory=lambda: np.zeros(5, dtype=np.float64))


@dataclass
class DilemmaScenario:
    """Representa un escenario o dilema situacional de onboarding."""
    dilemma_id: str
    title: str
    description: str
    options: List[ScenarioOption]


# =============================================================================
# ESTRUCTURA DE DATOS DE LOS 6 DILEMAS SITUACIONALES
# =============================================================================
DILEMMAS_CATALOG: List[DilemmaScenario] = [
    DilemmaScenario(
        dilemma_id="D1_PHYSICAL_LIMITS",
        title="Dilema 1: Límites Físicos y Nivel de Intercambio",
        description="Durante una fiesta privada swinger, una pareja muy atractiva les propone pasar a la habitación VIP. ¿Cuál es su postura?",
        options=[
            ScenarioOption(
                option_id="D1_OPT_SOFT_ONLY",
                text="Aceptamos compartir espacio, caricias y besos, pero prohibimos estrictamente cualquier penetración con terceros (Soft Swap puro).",
                delta_vector=np.array([-0.60, -0.10, -0.20, -0.30, -0.50], dtype=np.float64),
                vetoes={"no_penetration": True},
                practices={"full_swap_mandatory": False, "penetration_required": False},
                expected_polarity=np.array([-1.0, 0.0, -0.5, -0.5, -1.0])
            ),
            ScenarioOption(
                option_id="D1_OPT_FULL_SWAP",
                text="Aceptamos intercambio completo con penetración y juego directo sin restricciones corporales (Full Swap).",
                delta_vector=np.array([0.70, 0.10, 0.30, -0.20, 0.60], dtype=np.float64),
                vetoes={"no_penetration": False},
                practices={"penetration_required": True, "full_swap_mandatory": True},
                expected_polarity=np.array([1.0, 0.0, 0.5, -0.5, 1.0])
            ),
            ScenarioOption(
                option_id="D1_OPT_VOYEUR_EXHIBITION",
                text="Disfrutamos ver o ser vistos mientras jugamos, sin intercambio de fluidos o contacto genital directo con otros.",
                delta_vector=np.array([-0.80, 0.00, -0.80, -0.40, -0.40], dtype=np.float64),
                vetoes={"no_penetration": True},
                practices={"penetration_required": False},
                expected_polarity=np.array([-1.0, 0.0, -1.0, -0.5, -0.5])
            ),
            ScenarioOption(
                option_id="D1_OPT_SLOW_FLUID",
                text="Iniciamos observando y, según la química del momento, decidimos de forma fluida hasta dónde avanzar.",
                delta_vector=np.array([0.20, 0.00, 0.20, 0.10, 0.80], dtype=np.float64),
                vetoes={"no_penetration": False},
                practices={},
                expected_polarity=np.array([0.3, 0.0, 0.2, 0.0, 1.0])
            )
        ]
    ),
    DilemmaScenario(
        dilemma_id="D2_GENDER_ORIENTATION",
        title="Dilema 2: Inclusión de Terceros y Género",
        description="Al seleccionar nuevos perfiles para interactuar en la plataforma, ¿cuál es la configuración de participantes ideal?",
        options=[
            ScenarioOption(
                option_id="D2_OPT_UNICORN_BI",
                text="Buscamos exclusivamente una mujer sola (Unicornio) o bisexual para sumarse a nuestro juego de pareja.",
                delta_vector=np.array([0.10, -0.80, 0.10, -0.10, 0.20], dtype=np.float64),
                vetoes={"no_men": True, "no_single_men": True},
                practices={"is_single_woman": True},
                expected_polarity=np.array([0.0, -1.0, 0.0, 0.0, 0.0])
            ),
            ScenarioOption(
                option_id="D2_OPT_BULL_MALE",
                text="Buscamos la incorporación de un hombre solo (Bull) con buena presencia para enfocar la atención en la mujer.",
                delta_vector=np.array([0.30, 0.85, 0.40, -0.20, 0.30], dtype=np.float64),
                vetoes={"no_single_women": True},
                practices={"is_single_man": True, "seeking_male_interaction": True},
                expected_polarity=np.array([0.0, 1.0, 0.5, 0.0, 0.0])
            ),
            ScenarioOption(
                option_id="D2_OPT_COUPLES_ONLY",
                text="Interactuamos única y exclusivamente con parejas establecidas (pareja a pareja), rechazando personas solas.",
                delta_vector=np.array([0.00, 0.00, 0.20, 0.00, -0.40], dtype=np.float64),
                vetoes={"no_single_men": True, "no_single_women": True},
                practices={"has_male_partner": True},
                expected_polarity=np.array([0.0, 0.0, 0.0, 0.0, -0.5])
            )
        ]
    ),
    DilemmaScenario(
        dilemma_id="D3_POWER_JEALOUSY",
        title="Dilema 3: Manejo de Celos y Dinámicas de Poder",
        description="Si durante el encuentro una parte de la pareja recibe más atención o iniciativa física que la otra, ¿cómo se gestiona?",
        options=[
            ScenarioOption(
                option_id="D3_OPT_CUCKOLD_VOYEUR",
                text="Nos excita la asimetría: que uno sea el centro de atención mientras el otro observa o domina pasivamente.",
                delta_vector=np.array([0.20, 0.20, -0.85, -0.20, 0.30], dtype=np.float64),
                vetoes={},
                practices={},
                expected_polarity=np.array([0.0, 0.0, -1.0, 0.0, 0.0])
            ),
            ScenarioOption(
                option_id="D3_OPT_STRICT_EQUAL",
                text="Exigimos simetría estricta: ambos miembros debemos recibir la misma atención y participar en igualdad de condiciones.",
                delta_vector=np.array([-0.10, -0.10, 0.80, 0.10, -0.50], dtype=np.float64),
                vetoes={},
                practices={},
                expected_polarity=np.array([0.0, 0.0, 1.0, 0.0, -0.5])
            ),
            ScenarioOption(
                option_id="D3_OPT_SAFE_WORD_PAUSE",
                text="Aplicamos código o palabra de seguridad inmediata para pausar y reajustar si alguien siente incomodidad.",
                delta_vector=np.array([-0.20, 0.00, 0.40, 0.20, -0.70], dtype=np.float64),
                vetoes={},
                practices={},
                expected_polarity=np.array([0.0, 0.0, 0.5, 0.0, -1.0])
            )
        ]
    ),
    DilemmaScenario(
        dilemma_id="D4_EMOTIONAL_ATTACHMENT",
        title="Dilema 4: Afectividad vs. Placer Lúdico",
        description="¿Qué nivel de involucramiento emocional consideran aceptable con las personas con quienes comparten intimidad?",
        options=[
            ScenarioOption(
                option_id="D4_OPT_PURE_RECREATIONAL",
                text="Estrictamente recreativo y lúdico. No se permiten mensajes afectivos, citas románticas ni vinculación sentimental.",
                delta_vector=np.array([0.10, 0.00, 0.00, -0.85, -0.50], dtype=np.float64),
                vetoes={"no_emotional_bonding": True},
                practices={"requires_romantic_bond": False},
                expected_polarity=np.array([0.0, 0.0, 0.0, -1.0, -0.5])
            ),
            ScenarioOption(
                option_id="D4_OPT_FRIENDS_WITH_BENEFITS",
                text="Aceptamos 'amigos con derechos' (NSA/FWB): trato cordial y amistoso continuo, pero sin compromisos de pareja.",
                delta_vector=np.array([0.00, 0.00, 0.10, 0.20, 0.40], dtype=np.float64),
                vetoes={"no_emotional_bonding": False},
                practices={},
                expected_polarity=np.array([0.0, 0.0, 0.0, 0.2, 0.5])
            ),
            ScenarioOption(
                option_id="D4_OPT_POLYAMORY_ROMANTIC",
                text="Buscamos relaciones poliamorosas o triejas con afecto auténtico, proyectos compartidos y vínculo romántico.",
                delta_vector=np.array([0.30, -0.20, 0.20, 0.90, 0.60], dtype=np.float64),
                vetoes={"no_emotional_bonding": False},
                practices={"requires_romantic_bond": True},
                expected_polarity=np.array([0.0, 0.0, 0.0, 1.0, 0.5])
            )
        ]
    ),
    DilemmaScenario(
        dilemma_id="D5_SEXUAL_HEALTH",
        title="Dilema 5: Salud Sexual y Protocolo de Protección",
        description="Al acordar los términos de seguridad e higiene antes de una cita física, ¿cuál es la regla innegociable?",
        options=[
            ScenarioOption(
                option_id="D5_OPT_CONDOM_ALWAYS",
                text="Uso 100% obligatorio de preservativo en cualquier tipo de penetración o sexo oral, sin excepciones.",
                delta_vector=np.array([-0.10, 0.00, 0.10, -0.10, -0.80], dtype=np.float64),
                vetoes={"condom_mandatory": True},
                practices={"no_condoms": False},
                expected_polarity=np.array([0.0, 0.0, 0.0, 0.0, -1.0])
            ),
            ScenarioOption(
                option_id="D5_OPT_TESTS_TRUST",
                text="Aceptamos prescindir del preservativo solo si hay exámenes de ITS recientes presentados y confianza mutua.",
                delta_vector=np.array([0.40, 0.00, 0.20, 0.30, 0.70], dtype=np.float64),
                vetoes={"condom_mandatory": False},
                practices={"no_condoms": True},
                expected_polarity=np.array([0.0, 0.0, 0.0, 0.0, 1.0])
            )
        ]
    ),
    DilemmaScenario(
        dilemma_id="D6_LOGISTICS_AFTERMATH",
        title="Dilema 6: Logística del Encuentro y Post-Contacto",
        description="¿Cómo prefieren estructurar la locación y el seguimiento después de finalizar un encuentro?",
        options=[
            ScenarioOption(
                option_id="D6_OPT_NEUTRAL_HOTEL",
                text="Únicamente en territorio neutral (hoteles de paso o clubes swingers). Prohibido visitas a domicilios privados.",
                delta_vector=np.array([-0.20, 0.00, 0.00, -0.40, -0.60], dtype=np.float64),
                vetoes={"no_home_visits": True},
                practices={"home_visits_only": False},
                expected_polarity=np.array([0.0, 0.0, 0.0, -0.5, -1.0])
            ),
            ScenarioOption(
                option_id="D6_OPT_HOME_HOSTING",
                text="Preferimos recibir o visitar casas privadas para mayor comodidad, privacidad y tiempo de conversación.",
                delta_vector=np.array([0.20, 0.00, 0.10, 0.30, 0.50], dtype=np.float64),
                vetoes={"no_home_visits": False},
                practices={"home_visits_only": True},
                expected_polarity=np.array([0.0, 0.0, 0.0, 0.5, 0.5])
            ),
            ScenarioOption(
                option_id="D6_OPT_GHOSTING_BYE",
                text="Una vez terminado el encuentro, se agradece y cada parte regresa a sus actividades sin chats de seguimiento.",
                delta_vector=np.array([0.10, 0.00, -0.20, -0.80, -0.30], dtype=np.float64),
                vetoes={"no_emotional_bonding": True},
                practices={},
                expected_polarity=np.array([0.0, 0.0, 0.0, -1.0, 0.0])
            )
        ]
    )
]


# =============================================================================
# CLASE SITUATIONAL SCORING ENGINE
# =============================================================================
class SituationalScoringEngine:
    """
    Motor psicométrico que procesa las respuestas del onboarding situacional,
    aplica saturación no lineal (tanh), consolida los límites duros (hard-vetoes)
    y evalúa la consistencia interna del perfil.
    """

    def __init__(self, catalog: Optional[List[DilemmaScenario]] = None) -> None:
        self.catalog: List[DilemmaScenario] = catalog if catalog is not None else DILEMMAS_CATALOG
        self.dilemma_map: Dict[str, DilemmaScenario] = {d.dilemma_id: d for d in self.catalog}
        self.option_map: Dict[str, ScenarioOption] = {}
        for d in self.catalog:
            for opt in d.options:
                self.option_map[opt.option_id] = opt

    def process_responses(
        self, user_answers: Dict[str, str]
    ) -> Tuple[np.ndarray, Dict[str, bool], Dict[str, bool], float]:
        if not user_answers:
            raise ValueError("El diccionario de respuestas de onboarding no puede estar vacío.")

        accumulated_vector = np.zeros(5, dtype=np.float64)
        consolidated_vetoes: Dict[str, bool] = {}
        consolidated_practices: Dict[str, bool] = {}
        selected_polarities: List[np.ndarray] = []

        for dilemma_id, option_id in user_answers.items():
            if option_id not in self.option_map:
                continue

            option = self.option_map[option_id]

            # 1. Acumular deltas vectoriales
            accumulated_vector += option.delta_vector

            # 2. Consolidar vetos
            for v_key, v_val in option.vetoes.items():
                if v_val:
                    consolidated_vetoes[v_key] = True

            # 3. Consolidar prácticas
            for p_key, p_val in option.practices.items():
                if p_val:
                    consolidated_practices[p_key] = True

            # 4. Registrar polaridades
            selected_polarities.append(option.expected_polarity)

        # 5. Normalización mediante Tangente Hiperbólica (tanh)
        final_vector = np.tanh(accumulated_vector)
        final_vector = np.clip(final_vector, -1.0, 1.0)

        # 6. Cálculo del Índice de Consistencia
        consistency_index = self._calculate_profile_consistency(
            user_answers=user_answers,
            final_vector=final_vector,
            selected_polarities=selected_polarities,
            consolidated_vetoes=consolidated_vetoes,
            consolidated_practices=consolidated_practices
        )

        return final_vector, consolidated_vetoes, consolidated_practices, consistency_index

    def _calculate_profile_consistency(
        self,
        user_answers: Dict[str, str],
        final_vector: np.ndarray,
        selected_polarities: List[np.ndarray],
        consolidated_vetoes: Dict[str, bool],
        consolidated_practices: Dict[str, bool]
    ) -> float:
        penalty = 0.0

        if consolidated_vetoes.get("no_penetration", False) and consolidated_practices.get("penetration_required", False):
            penalty += 0.40

        if consolidated_vetoes.get("no_men", False) and consolidated_practices.get("seeking_male_interaction", False):
            penalty += 0.40

        if consolidated_vetoes.get("no_emotional_bonding", False) and consolidated_practices.get("requires_romantic_bond", False):
            penalty += 0.40

        if consolidated_vetoes.get("condom_mandatory", False) and consolidated_practices.get("no_condoms", False):
            penalty += 0.35

        if selected_polarities:
            polarity_matrix = np.array(selected_polarities)
            dimension_variances = np.var(polarity_matrix, axis=0)
            avg_variance = float(np.mean(dimension_variances))
            variance_penalty = min(0.35, avg_variance * 0.5)
            penalty += variance_penalty

        consistency_score = 1.0 - penalty
        return float(np.clip(consistency_score, 0.0, 1.0))


# =============================================================================
# FORMATEADOR DE PAYLOAD PARA SUPABASE / POSTGRESQL (pgvector)
# =============================================================================
def export_to_supabase_payload(
    user_id: str,
    vector_5d: np.ndarray,
    vetoes: Dict[str, bool],
    practices: Dict[str, bool],
    consistency_index: float,
    is_couple: bool = False
) -> Dict[str, Any]:
    v_list = np.round(vector_5d, 4).tolist()
    pgvector_str = "[" + ",".join(f"{x:.4f}" for x in v_list) + "]"

    return {
        "user_id": user_id,
        "is_couple": is_couple,
        "vector_5d_json": v_list,
        "vector_5d_pgvector": pgvector_str,
        "e1_relational_spectrum": v_list[0],
        "e2_third_party_orientation": v_list[1],
        "e3_power_dynamics": v_list[2],
        "e4_emotional_attachment": v_list[3],
        "e5_boundary_flexibility": v_list[4],
        "hard_vetoes": vetoes,
        "declared_practices": practices,
        "consistency_index": round(consistency_index, 4),
        "is_calibrated": consistency_index >= 0.70,
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


if __name__ == '__main__':
    print("=" * 80)
    print("EJECUTANDO SUITE DE PRUEBAS DEL MOTOR DE PROCESAMIENTO SITUACIONAL (SPRINT 1.2)")
    print("=" * 80)

    engine = SituationalScoringEngine()

    respuestas_caso_a = {
        "D1_PHYSICAL_LIMITS": "D1_OPT_FULL_SWAP",
        "D2_GENDER_ORIENTATION": "D2_OPT_UNICORN_BI",
        "D3_POWER_JEALOUSY": "D3_OPT_SAFE_WORD_PAUSE",
        "D4_EMOTIONAL_ATTACHMENT": "D4_OPT_PURE_RECREATIONAL",
        "D5_SEXUAL_HEALTH": "D5_OPT_CONDOM_ALWAYS",
        "D6_LOGISTICS_AFTERMATH": "D6_OPT_NEUTRAL_HOTEL"
    }

    vec_a, vetoes_a, practices_a, consistency_a = engine.process_responses(respuestas_caso_a)
    payload_a = export_to_supabase_payload(
        user_id="usr_unicorn_colombia_99",
        vector_5d=vec_a,
        vetoes=vetoes_a,
        practices=practices_a,
        consistency_index=consistency_a,
        is_couple=False
    )

    print(f"Vector 5D Resultante: {np.round(vec_a, 4).tolist()}")
    print(f"Vetos Activos: {list(vetoes_a.keys())}")
    print(f"Prácticas Declaradas: {list(practices_a.keys())}")
    print(f"Índice de Consistencia: {consistency_a:.4f} (Calibrado: {payload_a['is_calibrated']})")
    print("\nPayload para Supabase (`preference_vectors`):")
    print(json.dumps(payload_a, indent=2, ensure_ascii=False))

    assert consistency_a >= 0.70, "Caso A Falló."
    print("✅ CASO A PASÓ SATISFACTORIAMENTE.")
